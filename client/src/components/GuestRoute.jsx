import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth.js";
import LoadingScreen from "./LoadingScreen.jsx";

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
