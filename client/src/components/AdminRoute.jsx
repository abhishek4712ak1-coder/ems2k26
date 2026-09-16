import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth.js";
import LoadingScreen from "./LoadingScreen.jsx";
import AdminLayout from "./AdminLayout.jsx";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <AdminLayout>{children}</AdminLayout>;
};

export default AdminRoute;
