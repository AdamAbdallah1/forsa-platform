import { Navigate } from "react-router-dom";

export default function HiringRoute({ children }) {
  const account = JSON.parse(localStorage.getItem("forsaAccount")) || null;

  if (!account) return <Navigate to="/auth" replace />;

  if (account.accountType !== "hiring") {
    return <Navigate to="/explore" replace />;
  }

  return children;
}