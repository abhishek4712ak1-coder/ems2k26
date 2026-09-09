import { useContext } from "react";
import { AuthContext } from "./AuthContext.jsx";

const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

export default useAuth;