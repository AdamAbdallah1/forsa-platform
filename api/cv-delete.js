import {
  authenticate,
  getUser,
  isOwnKey,
  deleteObject,
} from "./_lib/forsa-server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const decoded = await authenticate(req);

    const { objectKey } = req.body || {};

    if (!isOwnKey(objectKey || "", decoded.uid)) {
      return res.status(403).json({
        error: "You are not allowed to delete this CV.",
      });
    }

    const user = await getUser(decoded.uid);

    if (
      !user ||
      user.cv?.storage !== "r2" ||
      user.cv.objectKey !== objectKey
    ) {
      return res.status(403).json({
        error: "You are not allowed to delete this CV.",
      });
    }

    await deleteObject(objectKey);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("CV delete endpoint failed:", error);

    const status = error.status || 500;

    return res.status(status).json({
      error: error.message || "Internal server error.",
    });
  }
}