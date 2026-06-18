import axios, { type InternalAxiosRequestConfig, type AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

// Augment axios's own config type so `_skipGlobalLoader` and `_trackLoading`
// are recognized as valid fields wherever AxiosRequestConfig is used.
declare module "axios" {
  export interface AxiosRequestConfig {
    _skipGlobalLoader?: boolean;
    _trackLoading?: boolean;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

let onRequestStart: (() => void) | null = null;
let onRequestEnd: (() => void) | null = null;

export function registerLoadingHandlers(
  start: (() => void) | null,
  end: (() => void) | null
) {
  onRequestStart = start;
  onRequestEnd = end;
}

export function skipGlobalLoader(): AxiosRequestConfig {
  return { _skipGlobalLoader: true };
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const skip = config._skipGlobalLoader === true;
  config._trackLoading = !skip;
  if (!skip) onRequestStart?.();

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config._trackLoading) onRequestEnd?.();
    return response;
  },
  (error) => {
    if (error.config?._trackLoading) onRequestEnd?.();

    if (error.response?.status === 401) {
      const data = error.response.data;
      const isAuthProbe = error.config?.url?.includes("/auth/me");

      if (data.kicked) {
        localStorage.removeItem("token");
        toast.error("You were logged in from another device.", {
          position: "top-center",
          autoClose: 3000,
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
        return Promise.reject(error);
      }

      if (!isAuthProbe) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);