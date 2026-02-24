// src/components/RequireAuth.jsx
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../store/auth';

const ADMIN_SLUG = process.env.REACT_APP_ADMIN_SLUG || 'dash';

export default function RequireAuth({ children }) {
  // MUST call isAuthed() here!
  const authed = useAuth(s => s.isAuthed());
  const { secret } = useParams();

  if (!authed) return <Navigate to="/login" replace />;

  // normalize to slug path
  if (ADMIN_SLUG && !secret) return <Navigate to={`/admin/${ADMIN_SLUG}`} replace />;

  // wrong slug? back to login (don’t leak the real slug)
  if (secret && ADMIN_SLUG && secret !== ADMIN_SLUG) return <Navigate to="/login" replace />;

  return children;
}
