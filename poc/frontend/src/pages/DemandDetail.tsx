import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Eye,
  EyeOff,
  FileSignature,
  Gavel,
  Sparkles,
  Trophy,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useDB } from "../components/useDB";
import { brl, dt, kg } from "../lib/format";
import { startAuction, toggleMatchSelection } from "../mock/services";
import type { Match } from "../mock/types";

export default function DemandDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const [revealTarget, setRevealTarget] = useState(false);

  const demand = db.demands.find((d) => d.id === id);
  const matches = db.matches.filter((m) => m.demand_id === id);
  const suppliers = matches.filter((m) => m.org_kind === "SUPPLIER");
  const carriers = matches.filter((m) => m.org_kind === "CARRIER");
  const auctions = db.auctions.filter((a) => a.demand_id === id);
  const contract = db.contracts.find((c) => c.demand_id === id);

  if (!demand) {
    return (
      <div className="card p-8 text-center text-steel-500">Demanda não encontrada.</div>
    );
  }

  const selectedSuppliers = suppliers.filter((m) => m.selected).length;
  const selectedCarriers = carriers.filter((m) => m.selected).length;

  const inAuction = auctions.length === 2 && !contract;
  const concluded = !!contract;

  function handleStart() {
    try {
      startAuction(id);
      navigate(`/auction/${id}`);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/buyer")} className="btn-ghost text-sm">
        <ArrowLeft className="w-3.5 h-3.5" />
        Painel do Comprador
      </button>

      <header className="card p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm text-steel-500 font-medium flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Demanda · publicada {dt(demand.created_at)}
            </div>
            <h1 className="text-2xl font-bold text-steel-900 mt-0.5">
              {demand.product} <span className="text-steel-500 font-normal">· {demand.norm}</span>
            </h1>
            <div className="text-sm text-steel-600 mt-1">
              {kg(demand.volume_kg)} · {demand.delivery_city}/{demand.delivery_uf} · até{" "}
              {dt(demand.deadline)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-steel-500 uppercase tracking-wider font-semibold flex items-center gap-1 justify-end">
              <EyeOff className="w-3 h-3" /> Preço-alvo confidencial
            </div>
            <button
              onClick={() => setRevealTarget((v) => !v)}
              className="font-mono text-xl font-bold text-steel-900 mt-0.5 hover:text-molten-700"
            >
              {revealTarget ? brl(demand.target_price_brl) : "•••••"}{" "}
              {revealTarget ? <EyeOff className="inline w-3.5 h-3.5" /> : <Eye className="inline w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {concluded && contract ? (
        <ContractGeneratedCard contractId={contract.id} navigate={navigate} />
      ) : inAuction ? (
        <AuctionInProgressCard demandId={id} navigate={navigate} />
      ) : (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-steel-900">Selecione os participantes do leilão</h2>
              <p className="text-xs text-steel-500">
                Escolha pelo menos 2 fornecedores e 2 transportadoras com base em score, selos e histórico.
              </p>
            </div>
            <button
              onClick={handleStart}
              disabled={selectedSuppliers < 2 || selectedCarriers < 2}
              className="btn-primary"
              data-tour="start-auction"
            >
              <Sparkles className="w-4 h-4" />
              Iniciar micro-leilão
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Group
              title="Fornecedores"
              icon={Briefcase}
              matches={suppliers}
              db={db}
              countSelected={selectedSuppliers}
              min={2}
            />
            <Group
              title="Transportadoras"
              icon={Truck}
              matches={carriers}
              db={db}
              countSelected={selectedCarriers}
              min={2}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function AuctionInProgressCard({
  demandId,
  navigate,
}: {
  demandId: string;
  navigate: (to: string) => void;
}) {
  return (
    <section className="card p-6 bg-gradient-to-br from-molten-50 to-white border-molten-300/60 relative overflow-hidden">
      <div className="absolute top-3 right-3">
        <span className="badge-warning animate-pulse-soft">
          <Gavel className="w-3 h-3" />
          AO VIVO
        </span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-molten-600 text-white flex items-center justify-center shadow-lg shadow-molten-600/30">
          <Gavel className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-steel-500 font-semibold uppercase tracking-widest">
            Sala privada · server-time UTC
          </div>
          <h2 className="font-bold text-xl text-steel-900">Leilão em andamento</h2>
        </div>
      </div>
      <p className="text-sm text-steel-600 max-w-2xl">
        O micro-leilão reverso já foi iniciado. Lances chegando em tempo real, soft close
        ativo. Você pode acompanhar e dar lance manual.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => navigate(`/auction/${demandId}`)}
          className="btn-primary"
        >
          Voltar ao leilão
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

function ContractGeneratedCard({
  contractId,
  navigate,
}: {
  contractId: string;
  navigate: (to: string) => void;
}) {
  return (
    <section className="card p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-300/60 relative overflow-hidden">
      <div className="absolute top-3 right-3">
        <span className="badge-success">
          <Trophy className="w-3 h-3" />
          ENCERRADA
        </span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
          <FileSignature className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-steel-500 font-semibold uppercase tracking-widest">
            Vencedores definidos pelo mercado
          </div>
          <h2 className="font-bold text-xl text-steel-900">Contrato gerado</h2>
        </div>
      </div>
      <p className="text-sm text-steel-600 max-w-2xl">
        O leilão foi encerrado e o contrato foi gerado automaticamente unindo os
        vencedores do produto e do frete. Continue o fluxo a partir daqui.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => navigate(`/contract/${contractId}`)}
          className="btn-primary"
        >
          Ver contrato + FSM
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

function Group({
  title,
  icon: Icon,
  matches,
  db,
  countSelected,
  min,
}: {
  title: string;
  icon: typeof Briefcase;
  matches: Match[];
  db: ReturnType<typeof useDB>;
  countSelected: number;
  min: number;
}) {
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-steel-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-steel-900">
          <Icon className="w-4 h-4 text-steel-500" />
          {title}
        </div>
        <span
          className={
            countSelected >= min
              ? "badge-success"
              : countSelected === 0
              ? "badge-neutral"
              : "badge-warning"
          }
        >
          {countSelected}/{min}+ selecionados
        </span>
      </div>
      {matches.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-steel-500">
          Aguardando matches do mercado…
        </div>
      ) : (
        <ul className="divide-y divide-steel-200/60">
          {matches.map((m) => {
            const org = db.orgs.find((o) => o.id === m.org_id);
            if (!org) return null;
            return (
              <li key={m.id}>
                <label
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    m.selected ? "bg-molten-50/40" : "hover:bg-steel-50"
                  }`}
                  data-tour={`select-${m.id}`}
                >
                  <input
                    type="checkbox"
                    checked={m.selected}
                    onChange={(e) => toggleMatchSelection(m.id, e.target.checked)}
                    className="mt-1 accent-molten-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-steel-900 truncate flex items-center gap-1.5">
                      {org.fantasia}
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-xs text-steel-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="font-mono">{org.cnpj}</span>
                      <span>· {org.uf}</span>
                      <span className="font-semibold text-steel-700">score {org.score}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {org.selos.map((s) => (
                        <span key={s} className="badge-neutral text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
