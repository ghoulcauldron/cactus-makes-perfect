import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    try {
      // extra safety: clear any stale auth
      localStorage.removeItem("auth_token");
    } catch {}
    return <Navigate to="/" replace />;
  }

  return children;
}