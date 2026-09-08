import { auth } from "./firebase";

export const CV_MAX_BYTES = 5 * 1024 * 1024;

async function apiRequest(path, body) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in again.");
  }

  const idToken = await user.getIdToken();

  let response;

  try {
    response = await fetch(`/api/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }

  const text = await response.text();

  let data = null;
  let unparseable = false;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      unparseable = true;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        (unparseable
          ? `The server returned an unexpected response (${response.status}).`
          : `Request failed (${response.status}).`)
    );
  }

  if (!data) {
    throw new Error("The server returned an unexpected response.");
  }

  return data;
}

export async function requestCvUpload(fileName, size) {
  return apiRequest("cv-upload", { fileName, size });
}

export async function uploadCvToR2(uploadUrl, file) {
  let response;

  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/pdf",
      },
      body: file,
    });
  } catch {
    throw new Error(
      "CV storage rejected the upload. Ensure the R2 bucket has a CORS policy that allows PUT from this site, then retry."
    );
  }

  if (!response.ok) {
    throw new Error("Upload failed. Please try again.");
  }
}

export async function requestCvView(objectKey, applicationId) {
  return apiRequest("cv-view", {
    objectKey,
    applicationId: applicationId || null,
  });
}

export async function requestCvDelete(objectKey) {
  return apiRequest("cv-delete", { objectKey });
}