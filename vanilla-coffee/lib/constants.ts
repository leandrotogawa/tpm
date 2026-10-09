export const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const CATEGORIAS_PRODUTO = ["Promoções", "Donuts", "Fatias", "Bebidas", "Combos"] as const;

export const STATUS_PEDIDO = ["Em preparo", "Concluído", "Cancelado"] as const;

export const TIPOS_CONSUMO = ["Retirada", "Delivery", "Consumir no local"] as const;

export const CAIXINHA_QTD = 4;
export const CAIXINHA_PRECO = 8;

export function brl(n: number) {
  return "R$ " + n.toFixed(2).replace(".", ",");
}
