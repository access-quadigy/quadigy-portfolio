// src/App.js
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import DetailPage from './pages/DetailPage';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext'; // ✅ import this

// Lazy pages
const Admin = React.lazy(() => import('./pages/Admin'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin')); // or swap to ./pages/Login if you prefer

function App() {
  return (
    <AuthProvider> {/* ✅ wrap the whole app once */}
      <Router>     {/* ✅ single Router */}
        <Navbar />
        <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/portfolio/:id" element={<DetailPage />} />
            <Route path="/login" element={<AdminLogin />} />

            {/* Protected Admin */}
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <Admin />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/:secret"
              element={
                <RequireAuth>
                  <Admin />
                </RequireAuth>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
