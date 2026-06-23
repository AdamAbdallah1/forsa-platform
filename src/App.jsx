import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import { setSession } from "./lib/auth";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import MyApplications from "./pages/MyApplications";
import Auth from "./pages/Auth";
import People from "./pages/People";
import NotFound from "./pages/NotFound";
import Companies from "./pages/Companies";
import PostOpportunity from "./pages/PostOpportunity";
import Dashboard from "./pages/Dashboard";
import AdminOutreach from "./pages/AdminOutreach";
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
import Toast from "./components/Toast";

const toIso = (value) => {
  if (!value) return new Date().toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

export default function App() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        localStorage.removeItem("forsaAccount");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) return;

        const data = userDoc.data();
        setSession({
          uid: currentUser.uid,
          ...data,
          createdAt: toIso(data.createdAt),
          updatedAt: toIso(data.updatedAt),
        });
      } catch (error) {
        console.error("Auth sync failed:", error);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <BrowserRouter>
      <main className="min-h-screen overflow-x-hidden bg-[var(--forsa-bg)] pb-24 text-[#111111] md:pb-0">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<SeekerRoute><Onboarding /></SeekerRoute>} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/dashboard" element={<HiringRoute><Dashboard /></HiringRoute>}/>
          <Route path="/admin-review" element={<AdminReview />} />
          <Route path="/saved" element={<ProtectedRoute><SavedJobs /></ProtectedRoute>} />
          <Route path="/applications" element={<SeekerRoute><MyApplications /></SeekerRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/seeker/:uid" element={<ProtectedRoute><PublicSeekerProfile /></ProtectedRoute>} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/people"element={<SeekerRoute><People /></SeekerRoute>}/>
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/text" element={<Text />} />
          <Route path="/admin/outreach" element={<AdminOutreach />} />
          <Route path="/applicants" element={<HiringRoute><Applicants /></HiringRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/company/:email" element={<CompanyProfile />} />
          <Route path="/post" element={<HiringRoute><PostOpportunity /></HiringRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileNav />
        <Toast />
      </main>
    </BrowserRouter>
  );
}
