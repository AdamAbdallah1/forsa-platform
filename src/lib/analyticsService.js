import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { getPostsByOwner } from "./postService";

export async function getCompanyAnalytics({ uid, email, name }) {
  const ownerPosts = await getPostsByOwner({ uid, email });

  const allPostsSnap = await getDocs(collection(db, "posts"));
  const allPosts = allPostsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const fallbackPosts = allPosts.filter(
    (post) =>
      !post.ownerEmail &&
      (post.ownerName === name || !post.ownerName)
  );

  const uniquePostsMap = new Map();
  [...ownerPosts, ...fallbackPosts].forEach((post) => {
    uniquePostsMap.set(post.id, post);
  });

  const posts = Array.from(uniquePostsMap.values());

  const appsQuery = query(
    collection(db, "applications"),
    where("ownerUid", "==", uid)
  );
  const appsSnap = await getDocs(appsQuery);
  const applications = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const rows = posts.map((post) => {
    const applicants = applications.filter(
      (thread) => thread.postId === post.id || thread.opportunityId === post.id
    );

    const views = Number(post.views || 0);
    const applicationsCount = applicants.length;
    const saves = Number(post.saves || 0);
    const shares = Number(post.shares || 0);
    const reports = Number(post.reports || 0);

    return {
      post,
      title: post.title,
      location: post.location,
      views,
      applications: applicationsCount,
      saves,
      shares,
      reports,
      avgFit: 0,
      conversionRate: views ? Math.round((applicationsCount / views) * 100) : 0,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      views: acc.views + r.views,
      applications: acc.applications + r.applications,
      saves: acc.saves + r.saves,
      shares: acc.shares + r.shares,
      reports: acc.reports + r.reports,
    }),
    { views: 0, applications: 0, saves: 0, shares: 0, reports: 0 }
  );

  const bestPost =
    rows.sort(
      (a, b) =>
        b.applications - a.applications ||
        b.views - a.views ||
        b.conversionRate - a.conversionRate
    )[0] || null;

  return {
    rows,
    totals: {
      ...totals,
      conversionRate: totals.views
        ? Math.round((totals.applications / totals.views) * 100)
        : 0,
      avgFit: 0,
    },
    bestPost,
  };
}
