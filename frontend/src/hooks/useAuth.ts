/**
 * useAuth Hook
 * Manages user authentication state
 */

import { useEffect, useState } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // For demo: create a user object
      // In production: call actual auth API
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        email: `${username}@example.com`,
      };

      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      setIsAuthenticated(true);

      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
  };
}
