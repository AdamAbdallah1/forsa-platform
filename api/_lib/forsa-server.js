import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/* -------------------------------------------------------------------------- */
/* Firebase Admin                                                             */
/* -------------------------------------------------------------------------- */

if (getApps().length === 0) {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      );
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON."
      );
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    serviceAccount = JSON.parse(
      readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
    );
  } else {
    throw new Error(
      "Missing Firebase service account configuration."
    );
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      serviceAccount.project_id,
  });
}

export const adminAuth = getAuth();
export const db = getFirestore();

export async function getUser(uid) {
  const snap = await db.collection("users").doc(uid).get();

  return snap.exists ? snap.data() : null;
}

/* -------------------------------------------------------------------------- */
/* Cloudflare R2                                                              */
/* -------------------------------------------------------------------------- */

export const CV_MAX_BYTES = 5 * 1024 * 1024;

let r2Client = null;

export function getR2() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey ||
    !process.env.R2_BUCKET_NAME
  ) {
    throw new Error(
      "R2 is not configured on the server."
    );
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return r2Client;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export function isValidFileName(fileName, size) {
  if (typeof fileName !== "string") {
    return false;
  }

  const clean = fileName.trim();

  if (!clean || clean.length > 120) {
    return false;
  }

  if (!/\.pdf$/i.test(clean)) {
    return false;
  }

  if (
    !Number.isInteger(size) ||
    size < 1 ||
    size > CV_MAX_BYTES
  ) {
    return false;
  }

  return true;
}

export function cvKeyFor(uid) {
  return `cvs/${uid}/${randomUUID()}.pdf`;
}

export function isOwnKey(objectKey, uid) {
  return (
    typeof objectKey === "string" &&
    objectKey.startsWith(`cvs/${uid}/`) &&
    objectKey.endsWith(".pdf")
  );
}

/* -------------------------------------------------------------------------- */
/* R2 operations                                                              */
/* -------------------------------------------------------------------------- */

export async function presignPut({ uid }) {
  const r2 = getR2();
  const Key = cvKeyFor(uid);

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key,
      ContentType: "application/pdf",
    }),
    { expiresIn: 120 }
  );

  return { uploadUrl, objectKey: Key };
}

export async function presignGet(objectKey) {
  const r2 = getR2();

  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
    }),
    { expiresIn: 300 }
  );
}

export async function deleteObject(objectKey) {
  const r2 = getR2();

  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
    })
  );
}

export async function objectMeta(objectKey) {
  const r2 = getR2();

  const result = await r2.send(
    new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
    })
  );

  return {
    contentType: String(result.ContentType || "").toLowerCase(),
    size: Number(result.ContentLength || 0),
  };
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export async function authenticate(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    const error = new Error("Unauthorized.");
    error.status = 401;
    throw error;
  }

  const idToken = authHeader.slice("Bearer ".length);

  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    const error = new Error("Invalid authentication token.");
    error.status = 401;
    throw error;
  }

  if (decodedToken.email_verified !== true) {
    const error = new Error("Email is not verified.");
    error.status = 403;
    throw error;
  }

  return decodedToken;
}