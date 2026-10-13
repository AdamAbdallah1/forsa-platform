import { useAuth } from "../contexts/AuthContext";
import EmployerGuides from "../components/EmployerGuides";
import HomeNavbar from "../components/HomeNavbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

/**
 * Employer Guide page — dedicated route at /employer-guide
 * Protected by HiringRoute (employer accounts only).
 */
export default function EmployerGuide() {
  const { account } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)] antialiased">
      <SEO
        title="Employer Guides — Hiring on Forsa"
        description="Hand-written guides for hiring on Forsa. Learn to set up your company profile, post opportunities, manage applications, and troubleshoot common issues."
      />

      <HomeNavbar />

      <main className="min-h-screen">
        <EmployerGuides account={account} />
      </main>

      <Footer />
    </div>
  );
}