import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user state lives only in memory → clears on refresh / close
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    // simple check → replace with real API if needed
    if (email === "admin" && password === "1234") {
      setUser({ email });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
