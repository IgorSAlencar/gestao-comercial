const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.13:3001';
const API_PATH = '/api';

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  apiUrl: `${API_BASE_URL}${API_PATH}`,
  path: API_PATH
};

export default API_CONFIG; 