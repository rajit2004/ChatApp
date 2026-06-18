import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { Bounce, toast } from "react-toastify";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import { MessageIcon } from "../components/ui/Icons";
import Spinner from "../components/ui/Spinner";

interface FieldStatus {
  checking: boolean;
  available: boolean | null;
}

export default function Signup() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Record<string, FieldStatus>>({
    username: { checking: false, available: null },
    email: { checking: false, available: null },
    phone: { checking: false, available: null },
  });

  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      Object.values(debounceRefs.current).forEach(clearTimeout);
    };
  }, []);

  const checkAvailability = (field: string, value: string) => {
    if (debounceRefs.current[field]) {
      clearTimeout(debounceRefs.current[field]);
    }

    if (!value.trim()) {
      setStatus((prev) => ({ ...prev, [field]: { checking: false, available: null } }));
      return;
    }

    setStatus((prev) => ({ ...prev, [field]: { checking: true, available: null } }));

    debounceRefs.current[field] = setTimeout(async () => {
      try {
        const res = await api.post("/auth/check-availability", { field, value });
        setStatus((prev) => ({
          ...prev,
          [field]: { checking: false, available: res.data.available },
        }));
      } catch {
        setStatus((prev) => ({ ...prev, [field]: { checking: false, available: null } }));
      }
    }, 500);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (["email", "username", "phone"].includes(field)) {
      checkAvailability(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const unavailable = Object.entries(status).find(([, s]) => s.available === false);
    if (unavailable) {
      toast.error(`${unavailable[0]} is already taken`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/signup", form);
      localStorage.setItem("token", res.data.token);
      toast.success(`Welcome, ${res.data.user.username}`, {
        position: "top-center",
        autoClose: 2000,
        transition: Bounce,
      });
      navigate("/chat", { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const getFieldStatus = (field: string): "success" | "error" | null => {
    const s = status[field];
    if (!form[field as keyof typeof form] || s.checking || s.available === null) return null;
    return s.available ? "success" : "error";
  };

  const StatusIcon = ({ field }: { field: string }) => {
    const s = status[field];
    const value = form[field as keyof typeof form];
    if (!value) return null;
    if (s.checking) {
      return (
        <div className="w-3.5 h-3.5 border-2 border-muted border-t-transparent rounded-full animate-spin" />
      );
    }
    if (s.available === true) return <span className="text-success text-xs">✓</span>;
    if (s.available === false) return <span className="text-danger text-xs">✗</span>;
    return null;
  };

  const StatusMessage = ({ field }: { field: string }) => {
    const s = status[field];
    const value = form[field as keyof typeof form];
    if (!value || s.checking || s.available === null) return null;
    return (
      <p className={`text-xs mt-1.5 ${s.available ? "text-success" : "text-danger"}`}>
        {s.available
          ? `${field.charAt(0).toUpperCase() + field.slice(1)} is available`
          : `This ${field} is already taken`}
      </p>
    );
  };

  const fields = ["username", "email", "phone"] as const;

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4 py-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center text-accent mb-4">
            <MessageIcon className="w-6 h-6" />
          </div>
          <h1 className="text-text text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-muted text-sm mt-1">Join and start messaging</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border p-6 rounded-xl shadow-xl"
        >
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field}>
                <label htmlFor={field} className="block text-xs font-medium text-muted mb-1.5">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <div className="relative">
                  <Input
                    id={field}
                    type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                    placeholder={
                      field === "username"
                        ? "Choose a username"
                        : field === "email"
                          ? "you@example.com"
                          : "Your phone number"
                    }
                    status={getFieldStatus(field)}
                    className="pr-8"
                    onChange={(e) => handleChange(field, e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <StatusIcon field={field} />
                  </div>
                </div>
                <StatusMessage field={field} />
              </div>
            ))}

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-muted mb-1.5">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                onChange={(e) => handleChange("password", e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || Object.values(status).some((s) => s.available === false)}
            fullWidth
            className="mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="w-4 h-4" />
                Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-muted text-sm mt-5 text-center">
            Already have an account?{" "}
            <Link to="/" className="text-accent hover:text-accent-hover transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
