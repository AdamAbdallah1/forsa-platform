import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getActivePosts } from "../lib/postService";
import {
  FaBriefcase,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaInstagram,
  FaMapMarkerAlt,
  FaSearch,
} from "react-icons/fa";

async function getHiringCompanies() {
  const snapshot = await getDocs(collection(db, "users"));

  return snapshot.docs
    .map((item) => ({
      uid: item.id,
      ...item.data(),
    }))
    .filter((user) => {
      const type = String(user.accountType || "").toLowerCase();

      return (
        type === "hiring" ||
        type === "company" ||
        user.companyName ||
        user.companyEmail
      );
    });
}

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const users = await getHiringCompanies();

        const activePosts = await getActivePosts();

        if (!active) return;

        setCompanies(users);
        setPosts(activePosts);
      } catch (error) {
        console.error("Companies load error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const filteredCompanies = useMemo(() => {
  const search = query.trim().toLowerCase();

  return companies.filter((company) => {
    const text = `
      ${company.companyName || ""}
      ${company.name || ""}
      ${company.city || ""}
      ${company.website || ""}
      ${company.instagram || ""}
      ${company.email || ""}
    `.toLowerCase();

    return !search || text.includes(search);
  });
}, [companies, query]);

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-7xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="relative mt-8 overflow-hidden rounded-[32px] border border-[var(--forsa-border)] bg-white p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--forsa-gold-soft)]/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--forsa-green)]/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-medium text-neutral-500">
              Companies
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Discover companies hiring on Forsa
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
              Browse startups, agencies, studios, local businesses, and
              verified companies hiring across Lebanon.
            </p>

            <div className="mt-7 flex items-center gap-3 rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-5 py-4">
              <FaSearch className="text-sm text-neutral-400" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search companies, city, website..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-[28px] border border-[var(--forsa-border)] bg-white p-10 text-center">
            <p className="font-medium">Loading companies...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-[var(--forsa-border)] bg-white p-10 text-center">
            <p className="font-medium">No companies found.</p>
            <p className="mt-2 text-sm text-neutral-500">
              Try another search.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCompanies.map((company) => {
              const companyPosts = posts.filter(
                (post) =>
                  post.ownerUid === company.uid ||
                  post.ownerEmail === company.email
              );

              return (
                <CompanyCard
                  key={company.uid || company.email}
                  company={company}
                  postsCount={companyPosts.length}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function CompanyCard({ company, postsCount }) {
  return (
    <div className="group relative overflow-hidden rounded-[30px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--forsa-gold-soft)]/30 blur-2xl opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                {company.companyName || company.name}
              </h2>

              {company.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--forsa-green)] px-2.5 py-1 text-[11px] font-medium text-white">
                  <FaCheckCircle className="text-[10px]" />
                  Verified
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-neutral-500">
              {company.contactPerson || "Company account"}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--forsa-bg)] text-[var(--forsa-green)]">
            <FaBriefcase />
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <InfoRow
            icon={<FaMapMarkerAlt />}
            text={company.city || "Lebanon"}
          />

          {company.website && (
            <InfoRow
              icon={<FaExternalLinkAlt />}
              text={company.website}
            />
          )}

          {company.instagram && (
            <InfoRow
              icon={<FaInstagram />}
              text={company.instagram}
            />
          )}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-[var(--forsa-bg)] px-4 py-3">
          <div>
            <p className="text-xs text-neutral-500">Open opportunities</p>
            <p className="mt-1 text-lg font-semibold">
              {postsCount}
            </p>
          </div>

          <Link
            to={`/company/${encodeURIComponent(company.email)}`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--forsa-green)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--forsa-green-light)]"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, text }) {
  return (
    <div className="flex items-center gap-3 text-sm text-neutral-600">
      <span className="text-neutral-400">
        {icon}
      </span>

      <span className="truncate">{text}</span>
    </div>
  );
}