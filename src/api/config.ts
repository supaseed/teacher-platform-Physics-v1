const DEFAULT_API_BASE = "https://mcq-gen-v1-0.onrender.com";

/** Backend origin. Override at build time with VITE_API_BASE_URL. */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE;
