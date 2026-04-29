import { patchDB, readDB, uid } from "./storage";
import type {
  Auction,
  AuctionLane,
  Bid,
  Contract,
  Demand,
  Match,
  Organization,
} from "./types";
import { logAudit } from "./seed";
import { encryptJSON, sha256Hex } from "./vault";

export function listOrgs(kind?: Organization["kind"]): Organization[] {
  const db = readDB();
  return kind ? db.orgs.filter((o) => o.kind === kind) : db.orgs;
}

export function getOrg(id: string): Organization | undefined {
  return readDB().orgs.find((o) => o.id === id);
}

export function listDemands(): Demand[] {
  return readDB().demands;
}

export function getDemand(id: string): Demand | undefined {
  return readDB().demands.find((d) => d.id === id);
}

export function getCurrentBuyer(): Organization {
  const db = readDB();
  const id = db.current_buyer_id;
  return db.orgs.find((o) => o.id === id)!;
}

export function getCurrentSupplier(): Organization {
  const db = readDB();
  const id = db.current_supplier_id;
  return db.orgs.find((o) => o.id === id)!;
}

export function createDemand(input: {
  product: string;
  norm: string;
  volume_kg: number;
  delivery_city: string;
  delivery_uf: string;
  deadline_days: number;
  target_price_brl: number;
}): Demand {
  const id = uid("dem");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 48);
  const deadline = new Date(now.getTime() + 1000 * 60 * 60 * 24 * input.deadline_days);
  const buyer = getCurrentBuyer();
  const demand: Demand = {
    id,
    buyer_id: buyer.id,
    product: input.product,
    norm: input.norm,
    volume_kg: input.volume_kg,
    delivery_city: input.delivery_city,
    delivery_uf: input.delivery_uf,
    deadline: deadline.toISOString(),
    target_price_brl: input.target_price_brl,
    status: "DEMANDA_PUBLICADA",
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
  patchDB((db) => {
    db.demands.unshift(demand);
  });
  logAudit("DEMAND_CREATED", "demand", id, {
    buyer: buyer.fantasia,
    target_price_brl: input.target_price_brl,
    confidential: true,
  });

  // simulate market discovering it within ~1.5s
  setTimeout(() => simulateMarketMatches(id), 1500);
  return demand;
}

function simulateMarketMatches(demandId: string) {
  const db = readDB();
  const dem = db.demands.find((d) => d.id === demandId);
  if (!dem) return;
  const suppliers = db.orgs.filter((o) => o.kind === "SUPPLIER");
  const carriers = db.orgs.filter((o) => o.kind === "CARRIER");
  const matches: Match[] = [];
  for (const s of suppliers) {
    matches.push({
      id: uid("mat"),
      demand_id: demandId,
      org_id: s.id,
      org_kind: "SUPPLIER",
      status: "MATCH_MUTUO",
      selected: false,
      created_at: new Date().toISOString(),
    });
  }
  for (const c of carriers) {
    matches.push({
      id: uid("mat"),
      demand_id: demandId,
      org_id: c.id,
      org_kind: "CARRIER",
      status: "MATCH_MUTUO",
      selected: false,
      created_at: new Date().toISOString(),
    });
  }
  patchDB((db2) => {
    db2.matches.push(...matches);
    const d = db2.demands.find((x) => x.id === demandId);
    if (d) d.status = "DEMANDA_COM_MATCHES";
  });
  logAudit("MARKET_MATCHED", "demand", demandId, {
    suppliers: suppliers.length,
    carriers: carriers.length,
  });
}

export function listMatchesFor(demandId: string): Match[] {
  return readDB().matches.filter((m) => m.demand_id === demandId);
}

export function toggleMatchSelection(matchId: string, selected: boolean) {
  patchDB((db) => {
    const m = db.matches.find((x) => x.id === matchId);
    if (m) m.selected = selected;
  });
}

export function startAuction(demandId: string): { product: Auction; freight: Auction } {
  const db = readDB();
  const dem = db.demands.find((d) => d.id === demandId);
  if (!dem) throw new Error("demand not found");

  const matches = db.matches.filter((m) => m.demand_id === demandId && m.selected);
  const suppliersSelected = matches.filter((m) => m.org_kind === "SUPPLIER").length;
  const carriersSelected = matches.filter((m) => m.org_kind === "CARRIER").length;
  if (suppliersSelected < 2) throw new Error("Selecione ao menos 2 fornecedores");
  if (carriersSelected < 2) throw new Error("Selecione ao menos 2 transportadoras");

  const now = new Date();
  const ends = new Date(now.getTime() + 1000 * 35);

  const startProduct = Math.round(dem.target_price_brl * 1.18 * 100) / 100;
  const startFreight = Math.round(dem.target_price_brl * 0.07 * 100) / 100;

  const product: Auction = {
    id: uid("auc"),
    demand_id: demandId,
    lane: "PRODUCT",
    status: "LEILAO_ATIVO",
    start_price_brl: startProduct,
    current_best_brl: startProduct,
    best_bidder_id: null,
    started_at: now.toISOString(),
    ends_at: ends.toISOString(),
    ended_at: null,
  };
  const freight: Auction = {
    id: uid("auc"),
    demand_id: demandId,
    lane: "FREIGHT",
    status: "LEILAO_ATIVO",
    start_price_brl: startFreight,
    current_best_brl: startFreight,
    best_bidder_id: null,
    started_at: now.toISOString(),
    ends_at: ends.toISOString(),
    ended_at: null,
  };
  patchDB((db2) => {
    const d = db2.demands.find((x) => x.id === demandId);
    if (d) d.status = "DEMANDA_EM_LEILAO";
    db2.auctions.push(product, freight);
  });
  logAudit("AUCTION_STARTED", "demand", demandId, {
    auctions: [product.id, freight.id],
    duration_s: 35,
  });
  return { product, freight };
}

export function listAuctionsFor(demandId: string): Auction[] {
  return readDB().auctions.filter((a) => a.demand_id === demandId);
}

export function listBidsFor(auctionId: string): Bid[] {
  return readDB()
    .bids.filter((b) => b.auction_id === auctionId)
    .sort((a, b) => (a.ts < b.ts ? 1 : -1));
}

export function getAuction(id: string): Auction | undefined {
  return readDB().auctions.find((a) => a.id === id);
}

export interface PlaceBidResult {
  ok: boolean;
  reason?: string;
  newAuction?: Auction;
  bid?: Bid;
  triggeredOvertime?: boolean;
}

export function placeBid(
  auctionId: string,
  orgId: string,
  amount: number,
  isUser: boolean,
): PlaceBidResult {
  const db = readDB();
  const auc = db.auctions.find((a) => a.id === auctionId);
  if (!auc) return { ok: false, reason: "auction not found" };
  if (auc.status !== "LEILAO_ATIVO" && auc.status !== "LEILAO_OVERTIME") {
    return { ok: false, reason: "leilão encerrado" };
  }
  if (amount >= auc.current_best_brl) {
    return { ok: false, reason: "lance precisa ser MENOR que o atual" };
  }
  if (auc.current_best_brl - amount > auc.start_price_brl * 0.5) {
    return { ok: false, reason: "diminuição implausível" };
  }

  const org = db.orgs.find((o) => o.id === orgId);
  const orgName = isUser ? "VOCÊ" : org?.fantasia || "Fornecedor";

  const now = new Date();
  const bid: Bid = {
    id: uid("bid"),
    auction_id: auctionId,
    org_id: orgId,
    org_name: orgName,
    amount_brl: amount,
    ts: now.toISOString(),
    is_user: isUser,
  };

  // soft close: if remaining < 8s, extend +8s
  const remaining = new Date(auc.ends_at).getTime() - now.getTime();
  let triggeredOvertime = false;
  let newEnds = auc.ends_at;
  let newStatus = auc.status;
  if (remaining < 8000) {
    newEnds = new Date(now.getTime() + 8000).toISOString();
    newStatus = "LEILAO_OVERTIME";
    triggeredOvertime = true;
  }

  let updated: Auction | undefined;
  patchDB((db2) => {
    const a = db2.auctions.find((x) => x.id === auctionId);
    if (!a) return;
    a.current_best_brl = amount;
    a.best_bidder_id = orgId;
    a.ends_at = newEnds;
    a.status = newStatus;
    db2.bids.unshift(bid);
    updated = a;
  });
  logAudit("BID_PLACED", "auction", auctionId, {
    org: orgName,
    amount,
    overtime: triggeredOvertime,
  });
  return { ok: true, newAuction: updated, bid, triggeredOvertime };
}

export function endAuction(auctionId: string): Auction | undefined {
  let updated: Auction | undefined;
  patchDB((db) => {
    const a = db.auctions.find((x) => x.id === auctionId);
    if (!a) return;
    if (a.status === "LEILAO_ENCERRADO") {
      updated = a;
      return;
    }
    a.status = "LEILAO_ENCERRADO";
    a.ended_at = new Date().toISOString();
    updated = a;
  });
  if (updated) {
    logAudit("AUCTION_ENDED", "auction", auctionId, {
      winner_org_id: updated.best_bidder_id,
      final_price_brl: updated.current_best_brl,
    });
  }
  return updated;
}

export function tryGenerateContract(demandId: string): Contract | undefined {
  const db = readDB();
  const auctions = db.auctions.filter((a) => a.demand_id === demandId);
  if (auctions.length !== 2) return undefined;
  if (!auctions.every((a) => a.status === "LEILAO_ENCERRADO")) return undefined;
  if (db.contracts.some((c) => c.demand_id === demandId)) {
    return db.contracts.find((c) => c.demand_id === demandId);
  }
  const product = auctions.find((a) => a.lane === "PRODUCT")!;
  const freight = auctions.find((a) => a.lane === "FREIGHT")!;
  const dem = db.demands.find((d) => d.id === demandId)!;
  const fee = Math.round(product.current_best_brl * 0.011 * 100) / 100;
  const contract: Contract = {
    id: uid("ct"),
    demand_id: demandId,
    buyer_id: dem.buyer_id,
    supplier_id: product.best_bidder_id!,
    carrier_id: freight.best_bidder_id!,
    product_price_brl: product.current_best_brl,
    freight_price_brl: freight.current_best_brl,
    fee_brl: fee,
    state: "CONTRATO_GERADO",
    payment_state: "PGTO_PENDENTE",
    nf_xml_value_brl: null,
    nf_uploaded_at: null,
    delivery_token_hash: null,
    delivered_at: null,
    window_ends_at: null,
    concluded_at: null,
    created_at: new Date().toISOString(),
  };
  patchDB((db2) => {
    db2.contracts.unshift(contract);
    const d = db2.demands.find((x) => x.id === demandId);
    if (d) d.status = "DEMANDA_ENCERRADA";
  });
  logAudit("CONTRACT_GENERATED", "contract", contract.id, {
    product_brl: contract.product_price_brl,
    freight_brl: contract.freight_price_brl,
    fee_brl: fee,
  });
  return contract;
}

export function getContract(id: string): Contract | undefined {
  return readDB().contracts.find((c) => c.id === id);
}

export function listContracts(): Contract[] {
  return readDB().contracts;
}

export function acceptContract(contractId: string): void {
  patchDB((db) => {
    const c = db.contracts.find((x) => x.id === contractId);
    if (!c) return;
    if (c.state !== "CONTRATO_GERADO") return;
    c.state = "CONTRATO_ACEITO";
    c.payment_state = "PGTO_EM_ANALISE";
  });
  logAudit("CONTRACT_ACCEPTED", "contract", contractId, {});
}

export interface UploadNFResult {
  ok: boolean;
  diff_brl: number;
  approved: boolean;
  reason?: string;
}

export async function uploadNF(contractId: string, vNF: number): Promise<UploadNFResult> {
  const db = readDB();
  const c = db.contracts.find((x) => x.id === contractId);
  if (!c) return { ok: false, diff_brl: 0, approved: false, reason: "contrato não encontrado" };
  const totalEscrow = c.product_price_brl + c.freight_price_brl + c.fee_brl;
  const diff = Math.abs(vNF - totalEscrow);
  const approved = diff <= 1.0;

  patchDB((db2) => {
    const cc = db2.contracts.find((x) => x.id === contractId);
    if (!cc) return;
    cc.nf_xml_value_brl = vNF;
    cc.nf_uploaded_at = new Date().toISOString();
    if (approved) {
      cc.payment_state = "PGTO_EM_ESCROW";
      cc.state = "CONTRATO_ATIVO_PAGAMENTO_CONFIRMADO";
    } else {
      cc.payment_state = "PGTO_EM_ANALISE_DIVERGENCIA";
    }
  });
  logAudit("NF_UPLOADED", "contract", contractId, {
    vNF,
    total_escrow: totalEscrow,
    diff_brl: diff,
    approved,
  });
  return { ok: true, diff_brl: diff, approved };
}

export async function authorizePickup(contractId: string): Promise<string> {
  const c = readDB().contracts.find((x) => x.id === contractId);
  if (!c) return "";
  const tokenInner = `${c.id}:${c.supplier_id}:${c.carrier_id}:${Date.now()}`;
  const hash = await sha256Hex(tokenInner);
  patchDB((db) => {
    const cc = db.contracts.find((x) => x.id === contractId);
    if (cc) cc.delivery_token_hash = hash;
  });
  logAudit("PICKUP_AUTHORIZED", "contract", contractId, { token_prefix: hash.slice(0, 12) });
  return hash;
}

export async function deliver(contractId: string): Promise<void> {
  const c = readDB().contracts.find((x) => x.id === contractId);
  if (!c) return;
  const proof = await encryptJSON(
    {
      contract_id: c.id,
      delivered_at: new Date().toISOString(),
      geo: { lat: -23.5505, lon: -46.6333 },
      signed_by: "carrier-app-v1.0",
    },
    readDB().tenant_key_b64,
  );
  patchDB((db) => {
    const cc = db.contracts.find((x) => x.id === contractId);
    if (!cc) return;
    cc.state = "CONTRATO_ENTREGUE_AGUARDANDO_JANELA";
    const wEnds = new Date(Date.now() + 1000 * 30); // 30s simula 72h
    cc.window_ends_at = wEnds.toISOString();
    cc.delivered_at = new Date().toISOString();
  });
  logAudit("DELIVERED", "contract", contractId, {
    proof_iv: proof.iv_b64.slice(0, 16),
    proof_ct_len: proof.ciphertext_b64.length,
  });
}

export function concludeIfWindowExpired(contractId: string): boolean {
  const c = readDB().contracts.find((x) => x.id === contractId);
  if (!c) return false;
  if (c.state !== "CONTRATO_ENTREGUE_AGUARDANDO_JANELA") return false;
  if (!c.window_ends_at) return false;
  if (new Date(c.window_ends_at).getTime() > Date.now()) return false;
  patchDB((db) => {
    const cc = db.contracts.find((x) => x.id === contractId);
    if (!cc) return;
    cc.state = "CONTRATO_CONCLUIDO";
    cc.payment_state = "PGTO_LIBERADO";
    cc.concluded_at = new Date().toISOString();
  });
  logAudit("CONTRACT_CONCLUDED", "contract", contractId, {
    reason: "TIMEOUT_72H",
    split_total_brl:
      (readDB().contracts.find((x) => x.id === contractId)?.product_price_brl || 0) +
      (readDB().contracts.find((x) => x.id === contractId)?.freight_price_brl || 0),
  });
  return true;
}

export function forceConclude(contractId: string): void {
  patchDB((db) => {
    const cc = db.contracts.find((x) => x.id === contractId);
    if (!cc) return;
    if (cc.state !== "CONTRATO_ENTREGUE_AGUARDANDO_JANELA") return;
    cc.state = "CONTRATO_CONCLUIDO";
    cc.payment_state = "PGTO_LIBERADO";
    cc.concluded_at = new Date().toISOString();
  });
  logAudit("CONTRACT_CONCLUDED", "contract", contractId, { reason: "MANUAL" });
}

export function getStats() {
  const db = readDB();
  const concluded = db.contracts.filter((c) => c.state === "CONTRATO_CONCLUIDO");
  const inFlight = db.contracts.filter((c) => c.state !== "CONTRATO_CONCLUIDO" && c.state !== "CONTRATO_CANCELADO");
  const totalGMV = db.contracts.reduce((sum, c) => sum + c.product_price_brl + c.freight_price_brl, 0);
  const concludedGMV = concluded.reduce((sum, c) => sum + c.product_price_brl + c.freight_price_brl, 0);
  const totalFees = db.contracts.reduce((sum, c) => sum + c.fee_brl, 0);
  return {
    contracts_total: db.contracts.length,
    contracts_concluded: concluded.length,
    contracts_in_flight: inFlight.length,
    total_gmv_brl: totalGMV,
    concluded_gmv_brl: concludedGMV,
    total_fees_brl: totalFees,
    total_demands: db.demands.length,
    total_orgs: db.orgs.length,
    audit_entries: db.audit.length,
  };
}

export function getAudit(limit = 50) {
  return readDB().audit.slice(0, limit);
}
