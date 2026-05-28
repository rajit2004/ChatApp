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
        localStorage.removeItem("token");
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8696a0] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return authenticated ? children : <Navigate to="/" />;
}