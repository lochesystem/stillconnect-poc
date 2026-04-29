import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  FileSignature,
  Lock,
  PackageCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { useDB } from "../components/useDB";
import { acceptContract } from "../mock/services";
import { brl } from "../lib/format";
import type { Contract as ContractType, ContractState } from "../mock/types";

const STATE_ORDER: ContractState[] = [
  "CONTRATO_GERADO",
  "CONTRATO_ACEITO",
  "CONTRATO_ATIVO_PAGAMENTO_CONFIRMADO",
  "CONTRATO_ENTREGUE_AGUARDANDO_JANELA",
  "CONTRATO_CONCLUIDO",
];

const STATE_INFO: Record<
  string,
  { label: string; sub: string; icon: typeof Check }
> = {
  CONTRATO_GERADO: { label: "Gerado", sub: "Contrato emitido", icon: FileSignature },
  CONTRATO_ACEITO: { label: "Aceito", sub: "Comprador aceitou termos", icon: Check },
  CONTRATO_ATIVO_PAGAMENTO_CONFIRMADO: {
    label: "Ativo + Escrow",
    sub: "Dinheiro travado, NF validada",
    icon: Lock,
  },
  CONTRATO_ENTREGUE_AGUARDANDO_JANELA: {
    label: "Entregue",
    sub: "Janela 72h em curso",
    icon: PackageCheck,
  },
  CONTRATO_CONCLUIDO: { label: "Concluído", sub: "Split realizado", icon: CheckCircle2 },
};

export default function Contract() {
  const { id = "", demandId = "" } = useParams();
  const navigate = useNavigate();
  const db = useDB();

  const contract = useMemo<ContractType | undefined>(() => {
    if (id) return db.contracts.find((c) => c.id === id);
    if (demandId) return db.contracts.find((c) => c.demand_id === demandId);
    return undefined;
  }, [db.contracts, id, demandId]);

  // se chegou via /contract/from-demand/:demandId, redireciona pra rota canônica
  useEffect(() => {
    if (contract && demandId && !id) {
      navigate(`/contract/${contract.id}`, { replace: true });
    }
  }, [contract, demandId, id, navigate]);

  if (!contract) {
    return <div className="card p-8 text-center text-steel-500">Contrato não encontrado.</div>;
  }

  const supplier = db.orgs.find((o) => o.id === contract.supplier_id);
  const carrier = db.orgs.find((o) => o.id === contract.carrier_id);
  const buyer = db.orgs.find((o) => o.id === contract.buyer_id);
  const total = contract.product_price_brl + contract.freight_price_brl + contract.fee_brl;

  const currentIdx = STATE_ORDER.indexOf(contract.state);

  const showAccept = contract.state === "CONTRATO_GERADO";
  const showEscrow = ["CONTRATO_ACEITO", "CONTRATO_ATIVO_PAGAMENTO_CONFIRMADO"].includes(
    contract.state,
  );
  const showLogistics = [
    "CONTRATO_ATIVO_PAGAMENTO_CONFIRMADO",
    "CONTRATO_ENTREGUE_AGUARDANDO_JANELA",
    "CONTRATO_CONCLUIDO",
  ].includes(contract.state);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/admin")} className="btn-ghost text-sm">
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </button>

      <header className="card p-6">
        <div className="flex items-start gap-4 flex-wrap justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-steel-500 font-medium">
              <FileSignature className="w-4 h-4" />
              Contrato · gerado automaticamente pelo leilão
            </div>
            <h1 className="text-2xl font-bold text-steel-900 mt-0.5 font-mono">
              {contract.id}
            </h1>
          </div>
          <div className="text-right">
            <div className="label">Valor total</div>
            <div className="text-2xl font-bold font-mono text-steel-900">{brl(total)}</div>
            <div className="text-xs text-steel-500 mt-0.5">
              fee Still: {brl(contract.fee_brl)}
            </div>
          </div>
        </div>
      </header>

      <FSM contract={contract} currentIdx={currentIdx} />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Party
          icon={Briefcase}
          role="Comprador"
          name={buyer?.fantasia ?? "—"}
          line={`CNPJ ${buyer?.cnpj}`}
          tone="text-sky-700 bg-sky-50"
        />
        <Party
          icon={Briefcase}
          role="Fornecedor"
          name={supplier?.fantasia ?? "—"}
          line={`Vencedor leilão de produto · ${brl(contract.product_price_brl)}`}
          tone="text-molten-700 bg-molten-50"
        />
        <Party
          icon={Truck}
          role="Transportadora"
          name={carrier?.fantasia ?? "—"}
          line={`Vencedor leilão de frete · ${brl(contract.freight_price_brl)}`}
          tone="text-emerald-700 bg-emerald-50"
        />
      </section>

      <section className="flex flex-wrap items-center gap-3">
        {showAccept && (
          <button
            onClick={() => acceptContract(contract.id)}
            className="btn-primary"
            data-tour="accept-contract"
          >
            <Check className="w-4 h-4" />
            Aceitar contrato
          </button>
        )}
        {showEscrow && (
          <button
            onClick={() => navigate(`/escrow/${contract.id}`)}
            className="btn-primary"
            data-tour="goto-escrow"
          >
            <Wallet className="w-4 h-4" />
            Escrow + Trava Fiscal
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {showLogistics && (
          <button
            onClick={() => navigate(`/logistics/${contract.id}`)}
            className="btn-secondary"
            data-tour="goto-logistics"
          >
            <Truck className="w-4 h-4" />
            Acompanhar logística
          </button>
        )}
      </section>
    </div>
  );
}

function FSM({ contract, currentIdx }: { contract: ContractType; currentIdx: number }) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-steel-900">Máquina de estados do contrato</h2>
          <p className="text-xs text-steel-500">
            Transições normativas (Bíblia Técnica). Estado atual destacado em laranja.
          </p>
        </div>
        <span className="badge-info font-mono text-[11px]">{contract.state}</span>
      </div>
      <ol className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATE_ORDER.map((s, idx) => {
          const info = STATE_INFO[s];
          const Icon = info.icon;
          const status =
            idx < currentIdx ? "done" : idx === currentIdx ? "current" : "pending";
          return (
            <li key={s} className="relative">
              <div
                className={`rounded-lg border-2 p-3 transition-all ${
                  status === "done"
                    ? "border-emerald-300 bg-emerald-50/60"
                    : status === "current"
                    ? "border-molten-500 bg-molten-50 shadow-md shadow-molten-500/10"
                    : "border-steel-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      status === "done"
                        ? "bg-emerald-500 text-white"
                        : status === "current"
                        ? "bg-molten-600 text-white animate-pulse-soft"
                        : "bg-steel-200 text-steel-500"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-steel-500">
                    {idx + 1}
                  </span>
                </div>
                <div className="font-semibold text-steel-900 text-sm">{info.label}</div>
                <div className="text-[11px] text-steel-500 leading-tight mt-0.5">
                  {info.sub}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Party({
  icon: Icon,
  role,
  name,
  line,
  tone,
}: {
  icon: typeof Briefcase;
  role: string;
  name: string;
  line: string;
  tone: string;
}) {
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-[10px] uppercase tracking-widest text-steel-500 font-bold mt-2">
        {role}
      </div>
      <div className="font-semibold text-steel-900 mt-0.5">{name}</div>
      <div className="text-xs text-steel-500 mt-0.5">{line}</div>
    </div>
  );
}
