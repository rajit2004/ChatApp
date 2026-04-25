
import { useState } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { Bounce, toast } from "react-toastify";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", form);
      console.log(res);
      

      navigate("/chat");
      toast.success(`${res.data.success}!! welcome ${res.data.user.username}`, {
position: "top-center",
autoClose: 2000,
hideProgressBar: false,
closeOnClick: false,
pauseOnHover: true,
draggable: true,
progress: undefined,
theme: "dark",
transition: Bounce,
})
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#111b21]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#202c33] p-8 rounded-xl w-96 shadow-lg"
      >
        <h2 className="text-white text-2xl mb-6 text-center font-semibold">
          Welcome Back
        </h2>

        <input
          placeholder="Email"
          className="w-full mb-4 p-3 rounded bg-[#2a3942] text-white outline-none"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded bg-[#2a3942] text-white outline-none"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button className="w-full bg-[#00a884] p-3 rounded text-white font-semibold">
          Login
        </button>

        <p className="text-gray-400 text-sm mt-4 text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[#00a884]">
            Signup
          </Link>
        </p>
      </form>
    </div>
  );
}