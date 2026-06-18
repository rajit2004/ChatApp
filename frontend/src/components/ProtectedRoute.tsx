import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, skipGlobalLoader } from "../services/api";
import { PageLoader } from "./ui/Loader";

export default function ProtectedRoute({ children }: { children: any }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await api.get("/auth/me", skipGlobalLoader());
        setAuthenticated(true);
      } catch {
        localStorage.removeItem("token");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  if (loading) {
    return <PageLoader message="Verifying your session..." />;
  }

  return authenticated ? children : <Navigate to="/" />;
}
