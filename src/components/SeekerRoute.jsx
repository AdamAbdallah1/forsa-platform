import { Navigate } from "react-router-dom";
import { getAccount } from "../lib/auth";

export default function SeekerRoute({ children }) {
  const account = getAccount();

  if (!account) return <Navigate to="/auth" replace />;
  if (account.accountType === "hiring") return <Navigate to="/post" replace />;

  return children;
}