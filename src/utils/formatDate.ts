// src/utils/formatDate.ts
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "—";
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
};

export const formatRelativeMonth = (monthsAgo: number): string => {
  const date = subMonths(new Date(), monthsAgo);
  return format(date, "MMM/yy", { locale: ptBR }).toUpperCase();
};

export const getRelativeMonths = () => {
  return {
    M0: formatRelativeMonth(0), // Mês atual
    M1: formatRelativeMonth(1), // Mês anterior
    M2: formatRelativeMonth(2), // Dois meses atrás
    M3: formatRelativeMonth(3), // Três meses atrás
  };
};
