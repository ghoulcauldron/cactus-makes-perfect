// apps/frontend/src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactElement;
}

export default function ProtectedRoute({ children }: Props) {
  // Look for token in localStorage
  const token = localStorage.getItem("auth_token");

  if (!token) {
    // Not logged in → redirect back to login ("/")
    return <Navigate to="/" replace />;
  }

  return children;
}