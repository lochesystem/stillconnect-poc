export type OrgKind = "BUYER" | "SUPPLIER" | "CARRIER";
export type OrgStatus = "EM_VALIDACAO" | "ATIVO" | "SUSPENSO" | "BLOQUEADO";

export interface Organization {
  id: string;
  cnpj: string;
  razao_social: string;
  fantasia: string;
  kind: OrgKind;
  status: OrgStatus;
  score: number;
  selos: string[];
  uf: string;
  created_at: string;
}

export type DemandStatus =
  | "DEMANDA_CRIADA"
  | "DEMANDA_PUBLICADA"
  | "DEMANDA_COM_MATCHES"
  | "DEMANDA_EM_LEILAO"
  | "DEMANDA_ENCERRADA"
  | "DEMANDA_CANCELADA";

export interface Demand {
  id: string;
  buyer_id: string;
  product: string;
  norm: string;
  volume_kg: number;
  delivery_city: string;
  delivery_uf: string;
  deadline: string;
  target_price_brl: number;
  status: DemandStatus;
  created_at: string;
  expires_at: string;
}

export type MatchStatus = "MATCH_PENDENTE" | "MATCH_MUTUO" | "MATCH_RECUSADO" | "MATCH_EXPIRADO";

export interface Match {
  id: string;
  demand_id: string;
  org_id: string;
  org_kind: "SUPPLIER" | "CARRIER";
  status: MatchStatus;
  selected: boolean;
  created_at: string;
}

export type AuctionLane = "PRODUCT" | "FREIGHT";
export type AuctionStatus =
  | "LEILAO_NAO_INICIADO"
  | "LEILAO_ATIVO"
  | "LEILAO_OVERTIME"
  | "LEILAO_ENCERRADO"
  | "LEILAO_CANCELADO";

export interface Auction {
  id: string;
  demand_id: string;
  lane: AuctionLane;
  status: AuctionStatus;
  start_price_brl: number;
  current_best_brl: number;
  best_bidder_id: string | null;
  ends_at: string;
  started_at: string;
  ended_at: string | null;
  overtime_count?: number;
}

export interface Bid {
  id: string;
  auction_id: string;
  org_id: string;
  org_name: string;
  amount_brl: number;
  ts: string;
  is_user: boolean;
}

export type ContractState =
  | "CONTRATO_GERADO"
  | "CONTRATO_ACEITO"
  | "CONTRATO_ATIVO_PAGAMENTO_CONFIRMADO"
  | "CONTRATO_ENTREGUE_AGUARDANDO_JANELA"
  | "CONTRATO_CONCLUIDO"
  | "CONTRATO_EM_DISPUTA"
  | "CONTRATO_RESOLVIDO_PROCEDENTE"
  | "CONTRATO_RESOLVIDO_IMPROCEDENTE"
  | "CONTRATO_CANCELADO";

export type PaymentState =
  | "PGTO_PENDENTE"
  | "PGTO_EM_ANALISE"
  | "PGTO_EM_ANALISE_DIVERGENCIA"
  | "PGTO_EM_ESCROW"
  | "PGTO_EM_DISPUTA"
  | "PGTO_LIBERADO"
  | "PGTO_ESTORNADO";

export interface Contract {
  id: string;
  demand_id: string;
  buyer_id: string;
  supplier_id: string;
  carrier_id: string;
  product_price_brl: number;
  freight_price_brl: number;
  fee_brl: number;
  state: ContractState;
  payment_state: PaymentState;
  nf_xml_value_brl: number | null;
  nf_uploaded_at: string | null;
  delivery_token_hash: string | null;
  delivered_at: string | null;
  window_ends_at: string | null;
  concluded_at: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  ts: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata: Record<string, unknown>;
}

export interface MockDB {
  orgs: Organization[];
  demands: Demand[];
  matches: Match[];
  auctions: Auction[];
  bids: Bid[];
  contracts: Contract[];
  audit: AuditEntry[];
  current_buyer_id: string;
  current_supplier_id: string;
  tenant_key_b64: string;
}
