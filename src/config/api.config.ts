const API_PATH = '/api';

// Prefer explicit Vite env var; otherwise use same-origin path (works with Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  apiUrl: `${API_BASE_URL}${API_PATH}`,
  path: API_PATH,
};

export default API_CONFIG;
