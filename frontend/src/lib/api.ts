const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'https://ksp-backend-1blb.onrender.com' : '')
).replace(/\/$/, '');

export const apiUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
};
