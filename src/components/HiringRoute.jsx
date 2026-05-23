import { Navigate } from "react-router-dom";
import { getAccount } from "../lib/auth";

export default function HiringRoute({ children }) {
  const account = getAccount();

  if (!account) return <Navigate to="/auth" replace />;
  if (account.accountType !== "hiring") return <Navigate to="/explore" replace />;

  return children;
}