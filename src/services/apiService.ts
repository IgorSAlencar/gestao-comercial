// src/services/apiService.ts
import axios from "axios";
import { API_CONFIG } from "@/config/api.config";

const API_BASE_URL = API_CONFIG.baseUrl;

export const getServerHealth = async () => {
  return await axios.get(`${API_BASE_URL}/api/health`);
};

export const fetchOportunidadesContas = async (token: string, tipoEstrategia: string) => {
  return await axios.get(`${API_BASE_URL}/api/oportunidades-contas`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { tipoEstrategia },
  });
};
