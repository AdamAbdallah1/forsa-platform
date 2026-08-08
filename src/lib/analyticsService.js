import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "./firebase";
import { getPostsByOwner } from "./postService";

const normalizeDocument = (doc) => ({
  id: doc.id,
  ...doc.data(),
});

const countByPostId = (documents) =>
  documents.reduce((acc, item) => {
    const postId = item.postId || item.opportunityId;

    if (!postId) return acc;

    const key = String(postId);
    acc[key] = (acc[key] || 0) + 1;

    return acc;
  }, {});

export async function getCompanyAnalytics({ uid, email }) {
  const auth = getAuth();

  console.log("LOCALSTORAGE UID:", uid);
  console.log("FIREBASE AUTH USER:", auth.currentUser);
  console.log("FIREBASE AUTH UID:", auth.currentUser?.uid);
  console.log("FIREBASE AUTH EMAIL:", auth.currentUser?.email);

  // ============================================================
  // 1. GET THIS COMPANY'S POSTS
  // ============================================================

  const ownerPosts = await getPostsByOwner({
    uid,
    email,
  });

  console.log("ANALYTICS UID:", uid);
  console.log("ANALYTICS EMAIL:", email);
  console.log("ANALYTICS OWNER POSTS:", ownerPosts);

  const posts = ownerPosts || [];

  // ============================================================
  // 2. GET THIS COMPANY'S APPLICATIONS
  //
  // IMPORTANT:
  // We ONLY query by ownerUid.
  //
  // The Firestore rules allow the authenticated owner to read
  // applications where application.ownerUid == auth.uid.
  //
  // We do NOT query ownerEmail because the Firestore rules do
  // not authorize that query.
  // ============================================================

  let applications = [];

  if (uid) {
    console.log(
      "ANALYTICS: querying applications by ownerUid:",
      uid
    );

    const applicationsQuery = query(
      collection(db, "applications"),
      where("ownerUid", "==", uid)
    );

    try {
      const applicationsSnapshot = await getDocs(
        applicationsQuery
      );

      console.log(
        "ANALYTICS: applications found:",
        applicationsSnapshot.size
      );

      applications = applicationsSnapshot.docs.map(
        normalizeDocument
      );

      console.log(
        "ANALYTICS: applications:",
        applications
      );
    } catch (error) {
      console.error(
        "ANALYTICS: APPLICATION QUERY FAILED:",
        error
      );

      throw error;
    }
  }

  // ============================================================
  // 3. COUNT APPLICATIONS BY POST
  // ============================================================

  const applicationCounts = countByPostId(applications);

  console.log(
    "ANALYTICS: application counts:",
    applicationCounts
  );

  // ============================================================
  // 4. BUILD ANALYTICS ROWS
  // ============================================================

  const rows = posts.map((post) => {
    const postId = String(post.id);

    const views = Number(post.views || 0);

    const applicationsCount =
      applicationCounts[postId] ||
      Number(post.applications || 0);

    const saves = Number(post.saves || 0);
    const shares = Number(post.shares || 0);
    const reports = Number(post.reports || 0);

    const conversionRate = views
      ? Math.round((applicationsCount / views) * 100)
      : 0;

    return {
      post,
      id: post.id,
      title: post.title || "Untitled Opportunity",
      location:
        post.location ||
        post.workCountry ||
        "Unknown",

      views,
      applications: applicationsCount,
      saves,
      shares,
      reports,

      avgFit: 0,
      conversionRate,
    };
  });

  console.log("ANALYTICS: rows:", rows);

  // ============================================================
  // 5. CALCULATE TOTALS
  // ============================================================

  const totals = rows.reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      applications: acc.applications + row.applications,
      saves: acc.saves + row.saves,
      shares: acc.shares + row.shares,
      reports: acc.reports + row.reports,
    }),
    {
      views: 0,
      applications: 0,
      saves: 0,
      shares: 0,
      reports: 0,
    }
  );

  const conversionRate = totals.views
    ? Math.round(
        (totals.applications / totals.views) * 100
      )
    : 0;

  // ============================================================
  // 6. FIND BEST-PERFORMING POST
  // ============================================================

  const bestPost =
    rows
      .slice()
      .sort(
        (a, b) =>
          b.applications - a.applications ||
          b.views - a.views ||
          b.conversionRate - a.conversionRate
      )[0] || null;

  // ============================================================
  // 7. RETURN DASHBOARD DATA
  // ============================================================

  const result = {
    rows,

    totals: {
      ...totals,
      conversionRate,
      avgFit: 0,
    },

    bestPost,
  };

  console.log("ANALYTICS FINAL RESULT:", result);

  return result;
}