export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api"
).replace(/\/+$/, "");

export const ENDPOINTS = {
  auth: {
    login: "/common/auth/login",
    refresh: "/common/auth/refresh",
    logout: "/common/auth/logout",
    me: "/common/auth/me",
  },
};

export const DEFAULT_FACTORY = process.env.NEXT_PUBLIC_DEFAULT_FACTORY || "VN";
