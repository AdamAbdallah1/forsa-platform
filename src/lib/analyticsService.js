import { collection, getDocs, increment, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase";
import { getPostsByOwner } from "./postService";

const normalizeDocument = (doc) => ({ id: doc.id, ...doc.data() });

const uniqueById = (items) => {
  const map = new Map();
  items.forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });
  return Array.from(map.values());
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const countByPostId = (documents) =>
  documents.reduce((acc, item) => {
    const postId = item.postId || item.opportunityId;
    if (!postId) return acc;
    const key = String(postId);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

export async function getCompanyAnalytics({ uid, email, name }) {
  const ownerPosts = await getPostsByOwner({ uid, email });
  const posts = ownerPosts || [];
  const postIds = posts.map((post) => String(post.id)).filter(Boolean);

  const queryDocs = async (collectionName, conditions = []) => {
    const queryRef = query(collection(db, collectionName), ...conditions);
    const snapshot = await getDocs(queryRef);
    return snapshot.docs.map(normalizeDocument);
  };

  const appQueries = [];
  if (uid) appQueries.push(query(collection(db, "applications"), where("ownerUid", "==", uid)));
  if (email) appQueries.push(query(collection(db, "applications"), where("ownerEmail", "==", email)));

  const applicationResults = await Promise.all(
    appQueries.map(async (q) => {
      const snap = await getDocs(q);
      return snap.docs.map(normalizeDocument);
    })
  );

  const applications = uniqueById(applicationResults.flat());

  const savedJobs = [];
  if (postIds.length > 0) {
    const chunks = chunkArray(postIds, 10);
    for (const chunk of chunks) {
      const savedQ = query(collection(db, "savedJobs"), where("postId", "in", chunk));
      const snap = await getDocs(savedQ);
      savedJobs.push(...snap.docs.map(normalizeDocument));
    }
  }

  const reports = [];
  if (postIds.length > 0) {
    const chunks = chunkArray(postIds, 10);
    for (const chunk of chunks) {
      const reportsQ = query(collection(db, "reports"), where("postId", "in", chunk));
      const snap = await getDocs(reportsQ);
      reports.push(...snap.docs.map(normalizeDocument));
    }
  }

  const savedCounts = countByPostId(savedJobs);
  const reportCounts = countByPostId(reports);
  const applicationCounts = countByPostId(applications);

  const rows = posts.map((post) => {
    const postId = String(post.id);
    const views = Number(post.views || 0);
    const applicationsCount = applicationCounts[postId] || 0;
    const saves = savedCounts[postId] || Number(post.saves || 0);
    const shares = Number(post.shares || 0);
    const reportsCount = reportCounts[postId] || Number(post.reports || 0);

    return {
      post,
      title: post.title,
      location: post.location || post.workCountry || "Unknown",
      views,
      applications: applicationsCount,
      saves,
      shares,
      reports: reportsCount,
      avgFit: 0,
      conversionRate: views ? Math.round((applicationsCount / views) * 100) : 0,
    };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      applications: acc.applications + row.applications,
      saves: acc.saves + row.saves,
      shares: acc.shares + row.shares,
      reports: acc.reports + row.reports,
    }),
    { views: 0, applications: 0, saves: 0, shares: 0, reports: 0 }
  );

  const bestPost = rows
    .slice()
    .sort(
      (a, b) =>
        b.applications - a.applications ||
        b.views - a.views ||
        b.conversionRate - a.conversionRate
    )[0] || null;

  return {
    rows,
    totals: {
      ...totals,
      conversionRate: totals.views ? Math.round((totals.applications / totals.views) * 100) : 0,
      avgFit: 0,
    },
    bestPost,
  };
}
