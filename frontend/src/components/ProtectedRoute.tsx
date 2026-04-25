import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../services/api";

export default function ProtectedRoute({ children }: { children: any }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await api.get("/auth/me"); 
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#111b21] text-white">
        Loading...
      </div>
    );
  }

  return authenticated ? children : <Navigate to="/" />;
}