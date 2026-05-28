import axios from "axios";
import { toast } from "react-toastify";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const data = error.response.data;

      if (data.kicked) {
        localStorage.removeItem("token");
        toast.error("You were logged in from another device.", {
          position: "top-center",
          theme: "dark",
          autoClose: 3000,
        });
        setTimeout(() => { window.location.href = "/"; }, 3000);
        return Promise.reject(error);
      }

      //  Handle expired/invalid token
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);