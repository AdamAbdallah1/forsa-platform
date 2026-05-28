import { Link } from "react-router-dom";
import {
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaEnvelope,
} from "react-icons/fa";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-[var(--forsa-border)] bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,var(--forsa-primary),transparent)] opacity-40" />

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <BrandLogo />

            <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-600">
              Forsa helps students, freelancers, creators, and companies in
              Lebanon connect through organized opportunities.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <SocialLink icon={<FaInstagram />} />
              <SocialLink icon={<FaTiktok />} />
              <SocialLink icon={<FaLinkedin />} />
            </div>
          </div>

          <FooterGroup
            title="Platform"
            links={[
              { label: "Explore", href: "/explore" },
              { label: "Post Opportunity", href: "/post" },
              { label: "Messages", href: "/messages" },
              { label: "Saved Jobs", href: "/saved" },
            ]}
          />

          <FooterGroup
            title="Company"
            links={[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
            ]}
          />

          <div>
            <p className="text-sm font-semibold tracking-[-0.02em]">
              Contact
            </p>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forsa-primary)] text-white">
                <FaEnvelope className="text-sm" />
              </div>

              <div>
                <p className="text-xs text-neutral-500">Email</p>
                <p className="text-sm font-medium">
                  support@forsa.digital
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--forsa-border)] pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Forsa. All rights reserved.</p>

          <p>
            Built for local opportunities in Lebanon.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }) {
  return (
    <div>
      <p className="text-sm font-semibold tracking-[-0.02em]">
        {title}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="text-sm text-neutral-600 transition hover:text-[var(--forsa-primary)]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SocialLink({ icon }) {
  return (
    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--forsa-border)] bg-white text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]">
      {icon}
    </button>
  );
}