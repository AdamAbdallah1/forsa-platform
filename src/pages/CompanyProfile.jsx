import { Link, useParams } from "react-router-dom";
import {
  FaBriefcase,
  FaCheckCircle,
  FaEnvelope,
  FaMapMarkerAlt,
  FaShieldAlt,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";

function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export default function CompanyProfile() {
  const { email } = useParams();

  const decodedEmail = decodeURIComponent(email || "");
  const account = safeJson("forsaAccount", null);
  const users = safeJson("forsaUsers", []);
  const posts = safeJson("forsaPosts", []);
  const trustedPosters = safeJson("forsaTrustedPosters", []);

  const companyUser = users.find(
    (user) =>
      user.accountType === "hiring" &&
      (user.email === decodedEmail || user.companyEmail === decodedEmail)
  );

  const companyPosts = posts.filter(
    (post) =>
      post.status !== "closed" &&
      (post.ownerEmail === decodedEmail ||
        post.contact === decodedEmail ||
        post.company === companyUser?.companyName ||
        post.company === companyUser?.name)
  );

  const fallbackPost = companyPosts[0];

  const companyName =
    companyUser?.companyName ||
    companyUser?.name ||
    fallbackPost?.company ||
    "Company";

  const companyCity =
    companyUser?.city || fallbackPost?.location || "Lebanon";

  const isTrusted = trustedPosters.includes(decodedEmail);

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-8 rounded-[30px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-lg font-semibold text-white">
                {companyName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                    {companyName}
                  </h1>

                  {isTrusted && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      <FaCheckCircle className="text-xs" />
                      Trusted
                    </span>
                  )}
                </div>

                <p className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
                  <FaMapMarkerAlt className="text-xs" />
                  {companyCity}
                </p>

                <p className="mt-2 flex items-center gap-2 break-all text-sm text-neutral-500">
                  <FaEnvelope className="text-xs" />
                  {account ? decodedEmail : "Login to view contact email"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f7f7f5] p-4 text-sm text-neutral-600 md:max-w-xs">
              <div className="flex items-center gap-2 font-medium text-black">
                <FaShieldAlt className="text-xs" />
                Company profile
              </div>
              <p className="mt-2 leading-6">
                View active opportunities from this poster and check basic trust
                signals before applying.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Active posts" value={companyPosts.length} />
            <Stat label="Location" value={companyCity} />
            <Stat label="Trust" value={isTrusted ? "Trusted" : "New"} />
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium text-neutral-500">Opportunities</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Active posts from {companyName}
          </h2>

          {companyPosts.length === 0 ? (
            <div className="mt-5 rounded-[26px] border border-neutral-200 bg-white p-8 text-center">
              <p className="font-medium">No active posts.</p>
              <p className="mt-2 text-sm text-neutral-500">
                This company has no active opportunities right now.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {companyPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/explore?post=${post.id}`}
                  className="rounded-[26px] border border-neutral-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
                      <FaBriefcase />
                    </div>

                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-semibold">
                        {post.title}
                      </h3>

                      <p className="mt-1 text-sm text-neutral-500">
                        {post.location} · {post.pay}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
                    {post.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(post.tags || []).slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f7f7f5] p-4">
      <p className="text-lg font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}