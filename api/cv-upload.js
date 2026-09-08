import {
  authenticate,
  isValidFileName,
  presignPut,
} from "./_lib/forsa-server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const decoded = await authenticate(req);

    const { fileName, size } = req.body || {};

    if (!isValidFileName(fileName, size)) {
      return res.status(400).json({
        error: "Only PDF files up to 5 MB are supported.",
      });
    }

    const { uploadUrl, objectKey } = await presignPut({
      uid: decoded.uid,
    });

    return res.status(200).json({
      uploadUrl,
      objectKey,
      expiresIn: 120,
    });
  } catch (error) {
    console.error("CV upload endpoint failed:", error);

    const status = error.status || 500;

    return res.status(status).json({
      error: error.message || "Internal server error.",
    });
  }
}