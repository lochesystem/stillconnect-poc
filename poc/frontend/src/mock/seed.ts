import { patchDB, readDB, uid, writeDB } from "./storage";
import type { MockDB, Organization } from "./types";
import { generateTenantKey } from "./vault";

const FANTASIA_BUYERS = [
  { fantasia: "Construtora Vértice", razao: "Vértice Engenharia LTDA", uf: "SP", score: 92 },
  { fantasia: "Pré-Moldados Aurora", razao: "Aurora Industrial S.A.", uf: "SP", score: 88 },
  { fantasia: "Eltus Construções", razao: "Eltus Construções LTDA", uf: "RJ", score: 79 },
];

const FANTASIA_SUPPLIERS = [
  {
    fantasia: "Siderúrgica Real",
    razao: "Real Siderurgia S.A.",
    uf: "MG",
    score: 95,
    selos: ["Produtor", "ISO 9001", "+1.2k contratos"],
  },
  {
    fantasia: "Distribuidora MetalPlus",
    razao: "MetalPlus Distribuição S.A.",
    uf: "SP",
    score: 87,
    selos: ["Distribuidor Premium", "+800 contratos"],
  },
  {
    fantasia: "Aço Forte Distribuição",
    razao: "Aço Forte LTDA",
    uf: "SP",
    score: 81,
    selos: ["Distribuidor", "+500 contratos"],
  },
  {
    fantasia: "Belmont Aços",
    razao: "Belmont Comércio de Aços LTDA",
    uf: "MG",
    score: 76,
    selos: ["Distribuidor", "+300 contratos"],
  },
  {
    fantasia: "Polo Industrial",
    razao: "Polo Industrial Comércio S.A.",
    uf: "SP",
    score: 84,
    selos: ["Distribuidor", "Pontualidade A"],
  },
];

const FANTASIA_CARRIERS = [
  {
    fantasia: "TransLogis Carga Pesada",
    razao: "TransLogis Transportes LTDA",
    uf: "SP",
    score: 91,
    selos: ["Carga industrial", "+5k entregas"],
  },
  {
    fantasia: "Rota Sul Cargas",
    razao: "Rota Sul Logística S.A.",
    uf: "SP",
    score: 86,
    selos: ["Carga industrial", "+2k entregas"],
  },
  {
    fantasia: "Express Pesados",
    razao: "Express Pesados Transp. LTDA",
    uf: "MG",
    score: 80,
    selos: ["+1k entregas"],
  },
];

function randomCNPJ(): string {
  const r = () => Math.floor(Math.random() * 10);
  const d8 = Array.from({ length: 8 }, r).join("");
  return `${d8.slice(0, 2)}.${d8.slice(2, 5)}.${d8.slice(5, 8)}/0001-${r()}${r()}`;
}

function buildOrg(
  kind: "BUYER" | "SUPPLIER" | "CARRIER",
  data: { fantasia: string; razao: string; uf: string; score: number; selos?: string[] },
): Organization {
  return {
    id: uid("org"),
    cnpj: randomCNPJ(),
    razao_social: data.razao,
    fantasia: data.fantasia,
    kind,
    status: "ATIVO",
    score: data.score,
    selos: data.selos ?? ["+100 contratos"],
    uf: data.uf,
    created_at: new Date().toISOString(),
  };
}

export async function seedIfNeeded(): Promise<void> {
  const existing = readDB();
  if (existing.orgs.length > 0) return;
  await reseed();
}

export async function reseed(): Promise<void> {
  const tenantKey = await generateTenantKey();

  const orgs: Organization[] = [
    ...FANTASIA_BUYERS.map((d) => buildOrg("BUYER", d)),
    ...FANTASIA_SUPPLIERS.map((d) => buildOrg("SUPPLIER", d)),
    ...FANTASIA_CARRIERS.map((d) => buildOrg("CARRIER", d)),
  ];

  const buyer = orgs.find((o) => o.kind === "BUYER")!;
  const supplier = orgs.find((o) => o.kind === "SUPPLIER")!;

  const next: MockDB = {
    orgs,
    demands: [],
    matches: [],
    auctions: [],
    bids: [],
    offers: [],
    negotiation_messages: [],
    contracts: [],
    audit: [
      {
        id: uid("aud"),
        ts: new Date().toISOString(),
        actor: "system",
        action: "TENANT_INIT",
        entity: "tenant",
        entity_id: "demo",
        metadata: { orgs_seeded: orgs.length },
      },
    ],
    current_buyer_id: buyer.id,
    current_supplier_id: supplier.id,
    tenant_key_b64: tenantKey,
  };
  writeDB(next);
}

export function logAudit(action: string, entity: string, entity_id: string, metadata: Record<string, unknown> = {}, actor = "system") {
  patchDB((db) => {
    db.audit.unshift({
      id: uid("aud"),
      ts: new Date().toISOString(),
      actor,
      action,
      entity,
      entity_id,
      metadata,
    });
    if (db.audit.length > 200) db.audit.length = 200;
  });
}
