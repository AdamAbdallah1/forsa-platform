import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import {
  FaArrowRight,
  FaBell,
  FaBriefcase,
  FaCheckCircle,
  FaEnvelope,
  FaFlag,
  FaGlobe,
  FaInstagram,
  FaMapMarkerAlt,
  FaRegBell,
  FaShieldAlt,
  FaUserTie,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import { showToast } from "../lib/Toast";
import { db } from "../lib/firebase";

function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function withProtocol(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

function instagramHref(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (raw.includes("/") || raw.includes("instagram.com")) {
    return withProtocol(raw);
  }

  return `https://instagram.com/${raw.replace(/^@/, "")}`;
}

export default function CompanyProfile() {
  const { email } = useParams();

  const decodedEmail = decodeURIComponent(email || "");
  const account = safeJson("forsaAccount", null);
  const localUsers = safeJson("forsaUsers", []);
  const localPosts = safeJson("forsaPosts", []);
  const trustedPosters = safeJson("forsaTrustedPosters", []);
  const [followedCompanies, setFollowedCompanies] = useState(
    safeJson("forsaFollowedCompanies", [])
  );

  const [remoteCompany, setRemoteCompany] = useState(null);
  const [remotePosts, setRemotePosts] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      let ownerUid = null;

      try {
        const byOwner = await getDocs(
          query(
            collection(db, "posts"),
            where("ownerEmail", "==", decodedEmail),
            limit(1)
          )
        );
        ownerUid = byOwner.docs[0]?.data()?.ownerUid || null;

        if (!ownerUid) {
          const byContact = await getDocs(
            query(
              collection(db, "posts"),
              where("contact", "==", decodedEmail),
              limit(1)
            )
          );
          ownerUid = byContact.docs[0]?.data()?.ownerUid || null;
        }
      } catch (error) {
        console.error("Company lookup error:", error);
      }

      if (!ownerUid) return;

      try {
        const userSnap = await getDoc(doc(db, "users", ownerUid));

        if (active && userSnap.exists()) {
          setRemoteCompany({ uid: userSnap.id, ...userSnap.data() });
        }
      } catch {
        // Signed-out visitors cannot read users/{uid} (rules require sign-in);
        // the company posts remain the public source of truth.
      }

      try {
        const postsSnap = await getDocs(
          query(collection(db, "posts"), where("ownerUid", "==", ownerUid))
        );

        if (active) {
          setRemotePosts(
            postsSnap.docs
              .map((item) => ({ id: item.id, ...item.data() }))
              .filter((post) => post.status !== "closed")
          );
        }
      } catch (error) {
        console.error("Company posts load error:", error);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [decodedEmail]);

  const localCompanyUser = localUsers.find(
    (user) =>
      user.accountType === "hiring" &&
      (user.email === decodedEmail || user.companyEmail === decodedEmail)
  );

  const localCompanyPosts = localPosts.filter(
    (post) =>
      post.status !== "closed" &&
      (post.ownerEmail === decodedEmail ||
        post.contact === decodedEmail ||
        post.company === localCompanyUser?.companyName ||
        post.company === localCompanyUser?.name)
  );

  const companyPosts = remotePosts.length > 0 ? remotePosts : localCompanyPosts;
  const fallbackPost = companyPosts[0];

  const companyUser = remoteCompany || localCompanyUser;

  const companyName =
    companyUser?.companyName ||
    companyUser?.name ||
    fallbackPost?.company ||
    "Company";

  const companyCity = companyUser?.city || fallbackPost?.location || "Lebanon";
  const isTrusted =
    trustedPosters.includes(decodedEmail) || Boolean(companyUser?.trusted);
  const isVerified = Boolean(companyUser?.verified);

  const companyBio = companyUser?.companyBio || "";
  const website = companyUser?.website || "";
  const instagram = companyUser?.instagram || "";

  const companyKey = decodedEmail || companyName;

  const isFollowing = followedCompanies.some(
    (item) => item.email === companyKey || item.name === companyName
  );

  const toggleFollow = () => {
    if (!account) {
      showToast("Create a seeker account to follow companies.", "error");
      return;
    }

    if (account.accountType === "hiring") {
      showToast("Company accounts cannot follow companies.", "error");
      return;
    }

    let next;

    if (isFollowing) {
      next = followedCompanies.filter(
        (item) => item.email !== companyKey && item.name !== companyName
      );
      showToast("Company unfollowed");
    } else {
      next = [
        {
          email: companyKey,
          name: companyName,
          city: companyCity,
          verified: isVerified,
          trusted: isTrusted,
          followedAt: new Date().toISOString(),
        },
        ...followedCompanies,
      ];
      showToast(`Following ${companyName}`);
    }

    setFollowedCompanies(next);
    writeJson("forsaFollowedCompanies", next);
  };

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-20">
        <div className="relative mt-6 overflow-hidden rounded-[34px] border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_rgba(109,40,217,0.10)] backdrop-blur-2xl sm:mt-8 sm:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--forsa-glow)]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[var(--forsa-primary)]/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,var(--forsa-primary),var(--forsa-glow))] text-2xl font-bold text-white shadow-[0_18px_40px_rgba(109,40,217,0.22)]">
                {companyName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                    {companyName}
                  </h1>

                  {isTrusted && <Badge icon={<FaCheckCircle />} text="Trusted" />}
                  {isVerified && <Badge icon={<FaShieldAlt />} text="Verified" />}
                </div>

                <div className="mt-4 grid gap-2 text-sm text-neutral-600">
                  <p className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-xs text-[var(--forsa-primary)]" />
                    {companyCity}
                  </p>

                  <p className="flex items-center gap-2 break-all">
                    <FaEnvelope className="text-xs text-[var(--forsa-primary)]" />
                    {account ? decodedEmail : "Login to view contact email"}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={toggleFollow}
                    className={`forsa-click inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${
                      isFollowing
                        ? "border border-[var(--forsa-border)] bg-white text-[var(--forsa-primary)]"
                        : "forsa-button text-white"
                    }`}
                  >
                    {isFollowing ? <FaBell className="text-xs" /> : <FaRegBell className="text-xs" />}
                    {isFollowing ? "Following" : "Follow company"}
                  </button>

                  <button type="button" onClick={() => showToast("Company reporting is coming soon.", "info")} className="forsa-click inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-600">
                    <FaFlag className="text-xs" />
                    Report
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--forsa-border)] bg-white/80 p-4 md:max-w-xs">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FaUserTie className="text-[var(--forsa-primary)]" />
                Hiring profile
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Follow companies to quickly find them later and get ready for future post alerts.
              </p>
            </div>
          </div>

          <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
            <Stat label="Active posts" value={companyPosts.length} />
            <Stat label="Location" value={companyCity} />
            <Stat label="Trust" value={isVerified ? "Verified" : isTrusted ? "Trusted" : "New poster"} />
          </div>
        </div>

        {(companyBio || website || instagram) && (
          <div className="relative mt-5 rounded-[28px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-medium text-neutral-500">About</p>

            {companyBio && (
              <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-neutral-700 sm:text-base">
                {companyBio}
              </p>
            )}

            {(website || instagram) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {website && (
                  <a
                    href={withProtocol(website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--forsa-primary)] transition hover:border-[var(--forsa-primary)]"
                  >
                    <FaGlobe className="text-xs" />
                    Website
                  </a>
                )}

                {instagramHref(instagram) && (
                  <a
                    href={instagramHref(instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--forsa-primary)] transition hover:border-[var(--forsa-primary)]"
                  >
                    <FaInstagram className="text-xs" />
                    Instagram
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-500">Opportunities</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
              Active posts from {companyName}
            </h2>
          </div>
        </div>

        {companyPosts.length === 0 ? (
          <div className="mt-5 rounded-[28px] border border-[var(--forsa-border)] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
              <FaBriefcase />
            </div>

            <p className="mt-5 font-semibold">No active posts right now.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
              Follow this company and check again later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {companyPosts.map((post) => (
              <CompanyPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CompanyPostCard({ post }) {
  return (
    <Link
      to={`/explore?post=${encodeURIComponent(post.id)}`}
      className="group rounded-[28px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--forsa-primary)] hover:shadow-[0_18px_55px_rgba(109,40,217,0.10)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
          <FaBriefcase />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold tracking-[-0.03em]">
            {post.title}
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            {post.location || "Lebanon"} · {post.pay || "Pay not specified"}
          </p>
        </div>

        <FaArrowRight className="mt-1 text-xs text-neutral-400 transition group-hover:translate-x-1 group-hover:text-[var(--forsa-primary)]" />
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-600">
        {post.description || "No description provided."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {[post.category, post.type, post.shift, post.experience]
          .filter(Boolean)
          .slice(0, 4)
          .map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-3 py-1.5 text-xs font-medium text-neutral-600"
            >
              {tag}
            </span>
          ))}
      </div>
    </Link>
  );
}

function Badge({ icon, text }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--forsa-primary)]">
      {icon}
      {text}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-[22px] border border-[var(--forsa-border)] bg-white/80 p-4 shadow-sm">
      <p className="truncate text-lg font-semibold tracking-[-0.03em]">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
    </div>
  );
}