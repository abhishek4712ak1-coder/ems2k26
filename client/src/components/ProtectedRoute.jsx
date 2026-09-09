import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../context/useAuth.js";
import LoadingScreen from "./LoadingScreen.jsx";
import AppLayout from "./AppLayout.jsx";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <AppLayout>{children}</AppLayout>;
};

export default ProtectedRoute;
