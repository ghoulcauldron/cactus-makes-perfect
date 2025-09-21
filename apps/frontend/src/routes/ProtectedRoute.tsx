import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  let isAuthenticated = false;

  try {
    // ✅ check if auth_token exists
    const token = localStorage.getItem("auth_token");
    isAuthenticated = !!token;
  } catch {
    isAuthenticated = false;
  }

  if (!isAuthenticated) {
    // redirect to calculator at root
    return <Navigate to="/" replace />;
  }

  return children;
}
