// Force the AppSail backend URL as the absolute fallback if env vars fail on Slate

const default_backend = "https://ksp-backend-1blb.onrender.com";
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:8085' : default_backend)

export const apiUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
};
