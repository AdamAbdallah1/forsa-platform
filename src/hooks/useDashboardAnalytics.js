import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useDashboardAnalytics(account) {
  const [data, setData] = useState({
    posts: [],
    totals: { views: 0, applications: 0, saves: 0, shares: 0, conversionRate: 0 },
    bestPost: null,
  });

  useEffect(() => {
    if (!account?.uid) return;

    const load = async () => {
      const postsSnap = await getDocs(collection(db, "posts"));
      const appsQuery = query(
        collection(db, "applications"),
        where("ownerUid", "==", account.uid)
      );
      const appsSnap = await getDocs(appsQuery);

      const posts = postsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const applications = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const myPosts = posts.filter(
        (p) =>
          p.ownerUid === account.uid ||
          p.ownerEmail === account.email ||
          (!p.ownerEmail && p.ownerName === account.name)
      );

      const rows = myPosts.map((post) => {
        const apps = applications.filter(
          (m) => m.postId === post.id || m.opportunityId === post.id
        );

        const views = post.views || 0;
        const applicationsCount = apps.length;
        const saves = post.saves || 0;
        const shares = post.shares || 0;

        return {
          id: post.id,
          title: post.title,
          location: post.location,
          views,
          applications: applicationsCount,
          saves,
          shares,
          conversionRate: views ? Math.round((applicationsCount / views) * 100) : 0,
        };
      });

      const totals = rows.reduce(
        (acc, r) => ({
          views: acc.views + r.views,
          applications: acc.applications + r.applications,
          saves: acc.saves + r.saves,
          shares: acc.shares + r.shares,
        }),
        { views: 0, applications: 0, saves: 0, shares: 0 }
      );

      const conversionRate = totals.views
        ? Math.round((totals.applications / totals.views) * 100)
        : 0;

      const bestPost =
        rows.sort((a, b) =>
          b.applications - a.applications || b.views - a.views
        )[0] || null;

      setData({
        posts: rows,
        totals: { ...totals, conversionRate },
        bestPost,
      });
    };

    load();
  }, [account?.uid, account?.email, account?.name]);

  return data;
}
