// src/utils/formatDate.ts
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatDate = (date: Date): string => {
  if (!date) return "—";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
};
