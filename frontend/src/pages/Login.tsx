import { useState } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { Bounce, toast } from "react-toastify";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import { MessageIcon } from "../components/ui/Icons";
import Spinner from "../components/ui/Spinner";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      toast.success(`Welcome back, ${res.data.user.username}`, {
        position: "top-center",
        autoClose: 1500,
        transition: Bounce,
      });
      navigate("/chat", { replace: true });
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.error(err.response.data.error || "Too many attempts. Try again later.");
      } else {
        toast.error(err.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center text-accent mb-4">
            <MessageIcon className="w-6 h-6" />
          </div>
          <h1 className="text-text text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-muted text-sm mt-1">Welcome back to your conversations</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border p-6 rounded-xl shadow-xl"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-muted mb-1.5">
                Email
              </label>
              <Input
                id="email"
                placeholder="you@example.com"
                type="email"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-muted mb-1.5">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} fullWidth className="mt-6">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="w-4 h-4" />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-muted text-sm mt-5 text-center">
            No account?{" "}
            <Link to="/signup" className="text-accent hover:text-accent-hover transition-colors">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
