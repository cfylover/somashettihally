import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const user = getCurrentUser();

  // If not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
