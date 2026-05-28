import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Companies from "./pages/Companies";
import PostOpportunity from "./pages/PostOpportunity";
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
import AdminReview from "./pages/AdminReview";
import Toast from "./components/Toast";

export default function App() {
  return (
    <BrowserRouter>
      <main className="min-h-screen overflow-x-hidden bg-[var(--forsa-bg)] pb-24 text-[#111111] md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />

          <Route
            path="/onboarding"
            element={
              <SeekerRoute>
                <Onboarding />
              </SeekerRoute>
            }
          />

          <Route path="/explore" element={<Explore />} />
          <Route path="/admin-review" element={<AdminReview />} />

          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedJobs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/companies" element={<Companies />} />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/text" element={<Text />} />
          <Route
            path="/applicants"
            element={
              <HiringRoute>
                <Applicants />
              </HiringRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route path="/company/:email" element={<CompanyProfile />} />

          <Route
            path="/post"
            element={
              <HiringRoute>
                <PostOpportunity />
              </HiringRoute>
            }
          />
        </Routes>

        <MobileNav />
        <Toast />
      </main>
    </BrowserRouter>
  );
}