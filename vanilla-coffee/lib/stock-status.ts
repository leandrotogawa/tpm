export type StockStatus = "feito-na-hora" | "esgotado" | "baixo" | "disponivel";

export function stockStatus(
  controlaEstoque: boolean,
  quantidade: number | null | undefined
): StockStatus {
  if (!controlaEstoque || quantidade == null) return "feito-na-hora";
  if (quantidade <= 0) return "esgotado";
  if (quantidade < 15) return "baixo";
  return "disponivel";
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  "feito-na-hora": "Feito na hora",
  esgotado: "Esgotado",
  baixo: "Estoque baixo",
  disponivel: "Disponível",
};

export const STOCK_STATUS_BADGE_CLASS: Record<StockStatus, string> = {
  "feito-na-hora": "badge-green",
  esgotado: "badge-red",
  baixo: "badge-amber",
  disponivel: "badge-green",
};
