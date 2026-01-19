import React, { useState } from "react";
import { adminLogin } from "./api/client";

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await adminLogin(password); // <-- send only password
      if (!res?.token) {
        setError("Invalid admin password");
        return;
      }

      localStorage.setItem("admin_token", res.token);
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      setError("Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Admin Password</label>
          <input
            type="password"
            className="border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded font-semibold hover:bg-gray-800"
        >
          Log In
        </button>
      </form>
    </div>
  );
}