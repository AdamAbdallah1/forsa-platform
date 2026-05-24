import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import PostOpportunity from "./pages/PostOpportunity";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import MobileNav from "./components/MobileNav";
import HiringRoute from "./components/HiringRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import SeekerRoute from "./components/SeekerRoute";
import AdminReview from "./pages/AdminReview";
import Toast from "./components/Toast";

export default function App() {
  return (
    <HashRouter>
      <main className="min-h-screen overflow-x-hidden bg-[#f7f7f5] pb-24 text-[#111111] md:pb-0">
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
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
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
    </HashRouter>
  );
}