import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { verifyAdminToken } from "./api/client";

export default function App() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setIsAuthed(false);
      navigate("/login");
      return;
    }

    (async () => {
      const valid = await verifyAdminToken(token);
      setIsAuthed(valid);
      if (!valid) navigate("/login");
    })();
  }, []);

  if (isAuthed === null) return <div>Loading…</div>;

  return <Outlet />;
}