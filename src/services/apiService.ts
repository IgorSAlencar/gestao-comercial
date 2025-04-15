// src/services/apiService.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:3001";

export const getServerHealth = async () => {
  return await axios.get(`${API_BASE_URL}/api/health`);
};

export const fetchOportunidadesContas = async (token: string, tipoEstrategia: string) => {
  return await axios.get(`${API_BASE_URL}/api/oportunidades-contas`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { tipoEstrategia },
  });
};
