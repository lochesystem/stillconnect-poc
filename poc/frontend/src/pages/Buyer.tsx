import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Briefcase, BadgeCheck, Eye, EyeOff } from "lucide-react";
import { useDB } from "../components/useDB";
import { brl, dt, kg } from "../lib/format";
import type { Demand, MockDB } from "../mock/types";
import { useMemo, useState } from "react";

const STATUS_LABELS: Record<Demand["status"], { label: string; tone: string }> = {
  DEMANDA_CRIADA: { label: "Criada", tone: "badge-neutral" },
  DEMANDA_PUBLICADA: { label: "Publicada", tone: "badge-info" },
  DEMANDA_COM_MATCHES: { label: "Com matches", tone: "badge-warning" },
  DEMANDA_EM_LEILAO: { label: "Em leilão", tone: "badge-warning" },
  DEMANDA_ENCERRADA: { label: "Encerrada", tone: "badge-success" },
  DEMANDA_CANCELADA: { label: "Cancelada", tone: "badge-danger" },
};

export default function Buyer() {
  const db = useDB();
  const navigate = useNavigate();
  const [showTarget, setShowTarget] = useState(false);

  const buyer = db.orgs.find((o) => o.id === db.current_buyer_id);
  const demands = useMemo(
    () => db.demands.filter((d) => d.buyer_id === db.current_buyer_id),
    [db.demands, db.current_buyer_id],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-steel-500 font-medium">
            <Briefcase className="w-4 h-4" /> Painel do Comprador
          </div>
          <h1 className="text-2xl font-bold text-steel-900 mt-0.5">
            {buyer?.fantasia || "Comprador"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge-success">
              <BadgeCheck className="w-3 h-3" /> KYB ATIVO
            </span>
            <span className="text-xs text-steel-500 font-mono">{buyer?.cnpj}</span>
            <span className="text-xs text-steel-500">· score {buyer?.score}</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/buyer/new")}
          className="btn-primary"
          data-tour="new-demand"
        >
          <Plus className="w-4 h-4" />
          Nova demanda
        </button>
      </header>

      <section className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="label">Demandas ativas</div>
          <div className="text-2xl font-bold text-steel-900 mt-1">{demands.length}</div>
        </div>
        <div className="card p-4">
          <div className="label">GMV histórico (este buyer)</div>
          <div className="text-2xl font-bold text-steel-900 mt-1 font-mono">
            {brl(
              db.contracts
                .filter((c) => c.buyer_id === db.current_buyer_id)
                .reduce((s, c) => s + c.product_price_brl + c.freight_price_brl, 0),
            )}
          </div>
        </div>
        <div className="card p-4">
          <div className="label">Spread médio reduzido</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">−4,2 p.p.</div>
        </div>
      </section>

      <section className="card">
        <div className="px-5 py-3 border-b border-steel-200/70 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-steel-900">Suas demandas</h2>
            <p className="text-xs text-steel-500">
              Preço-alvo é confidencial e nunca compartilhado com o mercado.
            </p>
          </div>
          <button
            onClick={() => setShowTarget((s) => !s)}
            className="btn-ghost text-xs"
            title="Visibilidade do preço-alvo"
          >
            {showTarget ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showTarget ? "Ocultar preço-alvo" : "Revelar preço-alvo"}
          </button>
        </div>
        {demands.length === 0 ? (
          <div className="px-5 py-12 text-center text-steel-500 text-sm">
            Nenhuma demanda ainda. Clique em <strong>Nova demanda</strong> para começar.
          </div>
        ) : (
          <ul className="divide-y divide-steel-200/60">
            {demands.map((d) => (
              <li key={d.id} data-tour={`demand-${d.id}`}>
                <Link
                  to={routeFor(d, db)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-steel-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-md bg-molten-100 text-molten-700 flex items-center justify-center font-mono text-xs">
                    {d.product.slice(0, 4)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-steel-900 truncate">
                      {d.product} <span className="text-steel-500 font-normal">· {d.norm}</span>
                    </div>
                    <div className="text-xs text-steel-500 mt-0.5">
                      {kg(d.volume_kg)} · entrega {d.delivery_city}/{d.delivery_uf} ·{" "}
                      até {dt(d.deadline)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-steel-500">Preço-alvo</div>
                    <div className="font-mono font-semibold text-steel-900">
                      {showTarget ? (
                        brl(d.target_price_brl)
                      ) : (
                        <span className="select-none tracking-widest text-steel-400">
                          •••••
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={STATUS_LABELS[d.status].tone}>
                    {STATUS_LABELS[d.status].label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-steel-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function routeFor(d: Demand, db: MockDB): string {
  const contract = db.contracts.find((c) => c.demand_id === d.id);
  if (contract) return `/contract/${contract.id}`;
  const auctions = db.auctions.filter((a) => a.demand_id === d.id);
  if (auctions.length === 2) return `/auction/${d.id}`;
  return `/buyer/demand/${d.id}`;
}
