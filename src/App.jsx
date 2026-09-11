import { Routes, Route, useLocation } from "react-router-dom";
import JobsInLebanon from "./pages/JobsInLebanon";
import Home from "./pages/Home";
import About from "./pages/About";
import Onboarding from "./pages/Onboarding";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import MyApplications from "./pages/MyApplications";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import JobDetails from "./pages/JobDetails";
import People from "./pages/People";
import NotFound from "./pages/NotFound";
import Companies from "./pages/Companies";
import PostOpportunity from "./pages/PostOpportunity";
import Dashboard from "./pages/Dashboard";
import AdminOutreach from "./pages/AdminOutreach";
import AdminEmail from "./pages/AdminEmail";
import ForgotPassword from "./pages/ForgotPassword";
import Text from "./pages/Text";
import Notifications from "./pages/Notifications";
import SavedJobs from "./pages/SavedJobs";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Applicants from "./pages/Applicants";
import Messages from "./pages/Messages";
import MobileNav from "./components/MobileNav";
import HiringRoute from "./components/HiringRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import SeekerRoute from "./components/SeekerRoute";
import CompanyProfile from "./pages/CompanyProfile";
import PublicSeekerProfile from "./pages/PublicSeekerProfile";
import AdminReview from "./pages/AdminReview";
import AdminRoute from "./components/AdminRoute";
import AuthRoute from "./components/AuthRoute";
import VerifyEmailRoute from "./components/VerifyEmailRoute";
import ForgotPasswordRoute from "./components/ForgotPasswordRoute";
import Toast from "./components/Toast";

import { useEffect } from "react";

const INDEXABLE_EXACT_PATHS = new Set([
  "/",
  "/about",
  "/jobs-in-lebanon",
  "/explore",
  "/companies",
  "/privacy",
  "/terms",
]);

const isIndexablePath = (pathname) => {
  if (INDEXABLE_EXACT_PATHS.has(pathname)) return true;
  return pathname.startsWith("/jobs/");
};

function RobotsController() {
  const location = useLocation();

  useEffect(() => {
    const content = isIndexablePath(location.pathname)
      ? "index, follow"
      : "noindex, nofollow";

    let tag = document.querySelector('meta[name="robots"]');

    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "robots");
      document.head.appendChild(tag);
    }

    tag.setAttribute("content", content);
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <RobotsController />
      <main className="min-h-screen overflow-x-hidden bg-[var(--forsa-bg)] pb-24 text-[#111111] md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/jobs-in-lebanon" element={<JobsInLebanon />} />
          <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
          <Route path="/verify-email" element={<VerifyEmailRoute><VerifyEmail /></VerifyEmailRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<SeekerRoute><Onboarding /></SeekerRoute>} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/jobs/:jobId" element={<JobDetails />} />
          <Route path="/dashboard" element={<HiringRoute><Dashboard /></HiringRoute>}/>
          <Route path="/admin-review" element={<AdminRoute><AdminReview /></AdminRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedJobs /></ProtectedRoute>} />
          <Route path="/applications" element={<SeekerRoute><MyApplications /></SeekerRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/seeker/:uid" element={<ProtectedRoute><PublicSeekerProfile /></ProtectedRoute>} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordRoute><ForgotPassword /></ForgotPasswordRoute>} />
          <Route path="/people"element={<SeekerRoute><People /></SeekerRoute>}/>
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/text" element={<Text />} />
          <Route path="/admin/outreach" element={<AdminRoute><AdminOutreach /></AdminRoute>} />
          <Route path="/admin/email" element={<AdminRoute><AdminEmail /></AdminRoute>} />
          <Route path="/applicants" element={<HiringRoute><Applicants /></HiringRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/company/:email" element={<CompanyProfile />} />
          <Route path="/post" element={<HiringRoute><PostOpportunity /></HiringRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileNav />
        <Toast />
      </main>
    </>
  );
}
