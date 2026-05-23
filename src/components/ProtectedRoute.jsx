import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const account = JSON.parse(localStorage.getItem("forsaAccount")) || null;

  if (!account) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}