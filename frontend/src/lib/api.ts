// Force the AppSail backend URL as the absolute fallback if env vars fail on Slate
const defaultBackend = 'https://kspapi-50044212290.development.catalystappsail.in';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:8085' : defaultBackend)
).replace(/\/$/, '');

export const apiUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
};
