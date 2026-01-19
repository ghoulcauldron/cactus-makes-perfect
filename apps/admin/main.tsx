import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import App from "./App"; // ProtectedRoute wrapper

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login onLoginSuccess={() => router.navigate("/")} />,
  },
  {
    path: "/",            // area51.cactusmakesperfect.org/
    element: <App />,     // validates token, then renders children
    children: [
      {
        path: "",         // root = dashboard
        element: <AdminDashboard />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);