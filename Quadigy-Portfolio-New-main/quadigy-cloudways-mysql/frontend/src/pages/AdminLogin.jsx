// src/pages/AdminLogin.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

const ADMIN_SLUG = process.env.REACT_APP_ADMIN_SLUG || 'dash';

export default function AdminLogin() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const login = useAuth(s => s.login);
  const authed = useAuth(s => s.isAuthed());
  const navigate = useNavigate();

  // if already authed, redirect once AFTER first render (avoid render-side effects)
  useEffect(() => {
    if (authed) navigate(`/admin/${ADMIN_SLUG}`, { replace: true });
  }, [authed, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const ok = await login(u.trim(), p);
    if (ok) {
      navigate(`/admin/${ADMIN_SLUG}`, { replace: true });
    } else {
      setErr('Login failed');
    }
  }

  return (
    <div className="admin-wrap">
      <div className="admin-card" style={{ maxWidth: 480, margin: '40px auto' }}>
        <h2 style={{ marginTop: 0 }}>Admin Login</h2>
        <p style={{ opacity: .75, marginTop: 4 }}>Enter your admin credentials to continue.</p>
        <form onSubmit={onSubmit} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div className="field">
            <label className="admin-label">Username</label>
            <input className="input" value={u} onChange={e => setU(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <label className="admin-label">Password</label>
            <input className="input" type="password" value={p} onChange={e => setP(e.target.value)} autoComplete="current-password" />
          </div>
          {err && <div style={{ color: '#b00020', fontWeight: 600 }}>{err}</div>}
          <button className="btn primary" type="submit">Log in</button>
        </form>
        <div style={{ marginTop: 10, fontSize: 12, opacity: .7 }}>
          
        </div>
      </div>
    </div>
  );
}
