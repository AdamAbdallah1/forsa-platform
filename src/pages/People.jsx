import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import AppHeader from "../components/AppHeader";
import SEO from "../components/SEO";
import { showToast } from "../lib/Toast";
import {
  followUser,
  unfollowUser,
  isFollowing,
} from "../lib/connectionService";
import {
  FaBriefcase,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaSearch,
  FaUser,
  FaUserCheck,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";

function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function cleanList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function People() {
  const account = safeJson("forsaAccount", null);

  const [people, setPeople] = useState([]);
  const [connectedIds, setConnectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyUid, setBusyUid] = useState(null);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");

  useEffect(() => {
    async function loadPeople() {
      try {
        const q = query(
          collection(db, "users"),
          where("accountType", "==", "finder")
        );

        const snap = await getDocs(q);

        const users = snap.docs
          .map((item) => ({
            uid: item.id,
            ...item.data(),
          }))
          .filter((user) => user.uid !== account?.uid);

        setPeople(users);

        if (account?.uid) {
          const checks = await Promise.all(
            users.map(async (user) => ({
              uid: user.uid,
              connected: await isFollowing(account.uid, user.uid),
            }))
          );

          setConnectedIds(
            checks.filter((item) => item.connected).map((item) => item.uid)
          );
        }
      } catch (error) {
        console.error("People load error:", error);
        showToast("Could not load people.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadPeople();
  }, [account?.uid]);

  const skillOptions = useMemo(() => {
    const all = people.flatMap((person) =>
      cleanList(person.skills || person.publicSkills)
    );

    return ["all", ...Array.from(new Set(all)).sort()];
  }, [people]);

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();

    return people
      .filter((person) => {
        const skills = cleanList(person.skills || person.publicSkills);
        const lookingFor = cleanList(person.lookingFor || person.publicLookingFor);

        const text = [
          person.name,
          person.email,
          person.city,
          person.bio,
          person.experience,
          person.education,
          ...skills,
          ...lookingFor,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !q || text.includes(q);
        const matchesSkill =
          skillFilter === "all" || skills.includes(skillFilter);

        return matchesSearch && matchesSkill;
      })
      .sort((a, b) => {
        const aScore = getProfileStrength(a);
        const bScore = getProfileStrength(b);
        return bScore - aScore;
      });
  }, [people, search, skillFilter]);

  const handleConnect = async (person) => {
    if (!account?.uid) {
      showToast("Login first to connect.", "error");
      return;
    }

    setBusyUid(person.uid);

    try {
      const connected = connectedIds.includes(person.uid);

      if (connected) {
        await unfollowUser({
          fromUid: account.uid,
          toUid: person.uid,
        });

        setConnectedIds((prev) => prev.filter((uid) => uid !== person.uid));
        showToast("Connection removed");
      } else {
        await followUser({
          fromUser: account,
          toUser: person,
        });

        setConnectedIds((prev) => [...prev, person.uid]);
        showToast("Connected");
      }
    } catch (error) {
      console.error("Connect error:", error);
      showToast(error.message || "Could not update connection.", "error");
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <SEO title="People" />
      <AppHeader />

      <div className="mx-auto max-w-[1180px] px-4 pb-28 pt-6 sm:px-6 lg:pb-20">
        <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_rgba(109,40,217,0.10)] backdrop-blur-2xl sm:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--forsa-glow)]/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white/80 px-3 py-2 text-xs font-semibold text-[var(--forsa-primary)] shadow-sm">
                <FaUsers className="text-xs" />
                Forsa network
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[0.96] tracking-[-0.06em] sm:text-4xl md:text-5xl">
                Discover people building their careers.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                Search students, freelancers, and job seekers by skills, city,
                profile details, and career goals.
              </p>
            </div>

            <div className="rounded-[24px] border border-[var(--forsa-border)] bg-white/80 p-4 text-sm text-neutral-600 lg:w-[260px]">
              <p className="font-semibold text-neutral-900">Network goal</p>
              <p className="mt-2 leading-6">
                Connect first. Messaging can come later when both people are connected.
              </p>
            </div>
          </div>

          <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
            <Stat label="People" value={people.length} />
            <Stat label="Connected" value={connectedIds.length} />
            <Stat label="Skills indexed" value={Math.max(0, skillOptions.length - 1)} />
          </div>
        </div>

        <div className="sticky top-[74px] z-20 -mx-4 mt-5 border-y border-[var(--forsa-border)] bg-white/92 px-4 py-3 shadow-[0_12px_40px_rgba(109,40,217,0.06)] backdrop-blur-2xl sm:mx-0 sm:rounded-[28px] sm:border sm:p-3">
          <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
            <div className="flex items-center gap-3 rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg-soft)]/65 px-4 py-3 transition focus-within:border-[var(--forsa-primary)] focus-within:bg-white">
              <FaSearch className="text-sm text-[var(--forsa-primary)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, skill, city, education..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-full bg-white px-2 py-1 text-xs text-neutral-500"
                >
                  Clear
                </button>
              )}
            </div>

            <select
              value={skillFilter}
              onChange={(event) => setSkillFilter(event.target.value)}
              className="rounded-full border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm font-semibold text-neutral-700 outline-none focus:border-[var(--forsa-primary)]"
            >
              {skillOptions.map((skill) => (
                <option key={skill} value={skill}>
                  {skill === "all" ? "All skills" : skill}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-[30px] border border-[var(--forsa-border)] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-[var(--forsa-bg-soft)]" />
            <p className="mt-5 font-semibold">Loading people...</p>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="mt-6 rounded-[30px] border border-[var(--forsa-border)] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
              <FaUser />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
              No people found.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600">
              Try another search or remove the skill filter.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPeople.map((person) => (
              <PersonCard
                key={person.uid}
                person={person}
                connected={connectedIds.includes(person.uid)}
                busy={busyUid === person.uid}
                onConnect={() => handleConnect(person)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function getProfileStrength(person) {
  const skills = cleanList(person.skills || person.publicSkills);
  const lookingFor = cleanList(person.lookingFor || person.publicLookingFor);

  const checks = [
    Boolean(person.name),
    Boolean(person.city),
    Boolean(person.bio),
    Boolean(person.experience),
    Boolean(person.education),
    Boolean(person.cv || person.publicCv),
    skills.length > 0,
    lookingFor.length > 0,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function PersonCard({ person, connected, busy, onConnect }) {
  const skills = cleanList(person.skills || person.publicSkills);
  const lookingFor = cleanList(person.lookingFor || person.publicLookingFor);
  const strength = getProfileStrength(person);

  return (
    <article className="forsa-card rounded-[30px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--forsa-primary)] hover:shadow-[0_18px_55px_rgba(109,40,217,0.10)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--forsa-primary),var(--forsa-glow))] text-lg font-bold text-white">
          {(person.name || "U").charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold tracking-[-0.04em]">
              {person.name || "User"}
            </h3>
            {strength >= 75 && (
              <FaCheckCircle className="shrink-0 text-xs text-[var(--forsa-primary)]" />
            )}
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
            <FaMapMarkerAlt className="text-[10px]" />
            {person.city || "Lebanon"}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
        {person.bio || "No public summary yet."}
      </p>

      <div className="mt-4 rounded-2xl bg-[var(--forsa-bg)] p-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-neutral-500">Profile strength</span>
          <span className="text-[var(--forsa-primary)]">{strength}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--forsa-primary),var(--forsa-glow))]"
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {skills.slice(0, 4).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--forsa-primary)]"
          >
            {skill}
          </span>
        ))}

        {skills.length > 4 && (
          <span className="rounded-full bg-[var(--forsa-bg)] px-3 py-1.5 text-xs font-semibold text-neutral-500">
            +{skills.length - 4}
          </span>
        )}
      </div>

      {lookingFor.length > 0 && (
        <p className="mt-4 line-clamp-1 text-xs font-medium text-neutral-500">
          Looking for: {lookingFor.slice(0, 3).join(", ")}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link
          to={`/seeker/${person.uid}`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
        >
          <FaBriefcase className="text-xs" />
          Profile
        </Link>

        <button
          onClick={onConnect}
          disabled={busy}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
            connected
              ? "border border-[var(--forsa-border)] bg-white text-[var(--forsa-primary)]"
              : "forsa-button text-white"
          }`}
        >
          {connected ? <FaUserCheck className="text-xs" /> : <FaUserPlus className="text-xs" />}
          {busy ? "..." : connected ? "Connected" : "Connect"}
        </button>
      </div>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-[22px] border border-[var(--forsa-border)] bg-white/78 p-4 shadow-sm backdrop-blur-xl">
      <p className="text-2xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
    </div>
  );
}