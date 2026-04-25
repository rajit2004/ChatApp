import { useState } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { Bounce, toast } from "react-toastify";

export default function Signup() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone:"",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res =await api.post("/auth/signup", form);

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
      toast.error(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#111b21]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#202c33] p-8 rounded-xl w-96"
      >
        <h2 className="text-white text-xl mb-4 text-center">Signup</h2>

        <input
          placeholder="Username"
          className="w-full mb-3 p-3 bg-[#2a3942] text-white rounded"
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
        />

        <input
          placeholder="Email"
          className="w-full mb-3 p-3 bg-[#2a3942] text-white rounded"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />
        <input
          placeholder="Phone Number"
          className="w-full mb-3 p-3 bg-[#2a3942] text-white rounded"
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 bg-[#2a3942] text-white rounded"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button className="w-full bg-[#00a884] p-3 rounded">
          Signup
        </button>

        <p className="text-gray-400 text-sm mt-3 text-center">
          Already have an account?{" "}
          <Link to="/" className="text-[#00a884]">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}