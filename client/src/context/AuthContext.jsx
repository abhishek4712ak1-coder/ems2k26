import { createContext, useEffect, useState } from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
} from "../services/api.js";
import LoadingScreen from "../components/LoadingScreen.jsx";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const checkAuth = async () => {
    try {
      setLoading(true);

      const response = await getCurrentUser();

      const currentUser =
        response?.data?.user ||
        response?.user ||
        null;

      setUser(currentUser);
    } catch (error) {
      if (error.status !== 401) {
        console.error("Authentication check failed:", error);
      }

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setAuthLoading(true);

      const response = await loginUser(email, password);

      const loggedInUser =
        response?.data?.user ||
        response?.user ||
        null;

      setUser(loggedInUser);

      return response;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      setAuthLoading(true);

      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const contextValue = {
    user,
    setUser,
    loading,
    authLoading,
    login,
    logout,
    checkAuth,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}

      {loading && <LoadingScreen />}

      {!loading && authLoading && <LoadingScreen />}
    </AuthContext.Provider>
  );
};

export { AuthContext };