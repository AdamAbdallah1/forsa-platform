import { Navigate } from "react-router-dom";
import { getAccount } from "../lib/auth";

export default function ProtectedRoute({ children }) {
  const account = getAccount();

  if (!account) return <Navigate to="/auth" replace />;

  return children;
}