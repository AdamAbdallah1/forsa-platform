import { Navigate } from "react-router-dom";

export default function SeekerRoute({ children }) {
  const account = JSON.parse(localStorage.getItem("forsaAccount")) || null;

  if (!account) return <Navigate to="/auth" replace />;

  if (account.accountType === "hiring") {
    return <Navigate to="/post" replace />;
  }

  return children;
}