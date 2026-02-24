// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  // redirect back to the page user came from (default → /admin)
  const from = location.state?.from?.pathname || "/admin";

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = login(email, password); // returns true/false
    if (ok) {
      navigate(from, { replace: true });
    } else {
      alert("Invalid credentials (default: admin / password)");
    }
  };

  return (
    <div className="login-container" style={{ textAlign: "center", marginTop: 100 }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit} style={{ display: "inline-block", textAlign: "left" }}>
        <input
          type="text"
          placeholder="Username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          required
          style={{ display: "block", marginBottom: 8, minWidth: 240 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          required
          style={{ display: "block", marginBottom: 12, minWidth: 240 }}
        />
        <button type="submit" className="btn primary" style={{ width: "100%" }}>
          Login
        </button>
      </form>
    </div>
  );
}
