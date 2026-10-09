export type Estoque = {
  id: string;
  produtoId: string;
  quantidade: number;
};

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
  emPromocao: boolean;
  categoria: string;
  preco: number;
  ativo: boolean;
  controlaEstoque: boolean;
  corIcone: string | null;
  ordem: number;
  criadoEm: string;
  estoque: Estoque | null;
};

export type Estabelecimento = {
  id: string;
  nome: string;
  descricao: string | null;
  cnpj: string | null;
  corMenu: string;
  logoUrl: string | null;
  capaUrl: string | null;
  instagram: string | null;
  whatsapp: string | null;
  telefone: string | null;
};

export type Horario = {
  id: string;
  diaSemana: number;
  aberto: boolean;
  horaAbre: string;
  horaFecha: string;
};

export type Complemento = {
  id: string;
  nome: string;
  aplicaA: string;
  preco: number;
  ativo: boolean;
};

export type Opcao = {
  id: string;
  nome: string;
  grupoOpcaoId: string;
};

export type GrupoOpcao = {
  id: string;
  nome: string;
  aplicaA: string;
  opcoes: Opcao[];
};

export type ItemPedido = {
  id: string;
  pedidoId: string;
  nomeSnapshot: string;
  precoSnapshot: number;
  quantidade: number;
};

export type Pedido = {
  id: string;
  numero: number;
  cliente: string;
  tipoConsumo: string;
  formaPagamento: string;
  canal: string;
  status: string;
  subtotal: number;
  total: number;
  criadoEm: string;
  itens: ItemPedido[];
};

export type ConfigPagamento = {
  id: string;
  pix: boolean;
  dinheiro: boolean;
  credito: boolean;
  debito: boolean;
};

export type ConfigNotificacao = {
  id: string;
  novoPedidoWhatsapp: boolean;
  somAlertaPainel: boolean;
};
