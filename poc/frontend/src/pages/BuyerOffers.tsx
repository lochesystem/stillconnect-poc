import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  FileSignature,
  MessageCircle,
  X,
} from "lucide-react";
import { useDB } from "../components/useDB";
import NegotiationChatModal from "../components/NegotiationChatModal";
import { acceptOffer, listOffersForDemand, offersWindowOpen, rejectOffer } from "../mock/services";
import { brl, dt, kg } from "../lib/format";

export default function BuyerOffers() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const demand = db.demands.find((d) => d.id === id);
  const [now, setNow] = useState(Date.now());
  const [chatOfferId, setChatOfferId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!demand) {
    return <div className="card p-8 text-center text-steel-500">Demanda não encontrada.</div>;
  }

  if (demand.buyer_id !== db.current_buyer_id) {
    return <div className="card p-8 text-center text-steel-500">Acesso restrito ao comprador.</div>;
  }

  const offers = listOffersForDemand(id);
  const pending = offers.filter((o) => o.status === "PENDENTE");
  const windowOpen = offersWindowOpen(demand);
  const closesMs = Math.max(0, new Date(demand.offers_close_at).getTime() - now);
  const hasContract = !!db.contracts.find((c) => c.demand_id === id);

  function handleAccept(offerId: string) {
    try {
      const c = acceptOffer(offerId);
      if (c) navigate(`/contract/${c.id}`);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  function handleReject(offerId: string) {
    try {
      rejectOffer(offerId);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(`/buyer/demand/${id}`)} className="btn-ghost text-sm">
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar à demanda
      </button>

      <header className="card p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm text-steel-500 font-medium flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Coleta de ofertas (RFQ)
            </div>
            <h1 className="text-2xl font-bold text-steel-900 mt-0.5">
              {demand.product} <span className="text-steel-500 font-normal">· {demand.norm}</span>
            </h1>
            <div className="text-sm text-steel-600 mt-1">
              {kg(demand.volume_kg)} · entrega {demand.delivery_city}/{demand.delivery_uf}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end text-sm font-semibold">
              <Clock className="w-4 h-4 text-steel-400" />
              {windowOpen ? (
                <span className="text-molten-700">
                  Ofertas até {dt(demand.offers_close_at)} ·{" "}
                  <span className="font-mono">{fmtRemain(closesMs)}</span>
                </span>
              ) : (
                <span className="text-steel-500">Janela encerrada</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="card">
        <div className="px-5 py-3 border-b border-steel-200/70">
          <h2 className="font-semibold text-steel-900">Ofertas recebidas</h2>
          <p className="text-xs text-steel-500">
            Aceite uma proposta para gerar o contrato automaticamente. As demais pendentes serão
            marcadas como recusadas.
          </p>
        </div>
        {pending.length === 0 ? (
          <div className="px-5 py-12 text-center text-steel-500 text-sm">
            Nenhuma oferta pendente. Convide os fornecedores pela aba Fornecedor para enviarem
            proposta.
          </div>
        ) : (
          <ul className="divide-y divide-steel-200/60">
            {pending.map((o) => {
              const sup = db.orgs.find((org) => org.id === o.supplier_org_id);
              const car = db.orgs.find((org) => org.id === o.carrier_org_id);
              const total = o.product_price_brl + o.freight_price_brl;
              return (
                <li key={o.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-steel-900">{sup?.fantasia ?? "Fornecedor"}</div>
                    <div className="text-xs text-steel-500 mt-0.5">
                      Frete via {car?.fantasia ?? "—"} · enviada {dt(o.created_at)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 font-mono text-sm">
                      <span>
                        Produto: <strong>{brl(o.product_price_brl)}</strong>
                      </span>
                      <span>
                        Frete: <strong>{brl(o.freight_price_brl)}</strong>
                      </span>
                      <span className="text-steel-700">
                        Total: <strong>{brl(total)}</strong>
                      </span>
                    </div>
                    {o.note ? (
                      <p className="text-xs text-steel-600 mt-2 italic border-l-2 border-steel-200 pl-2">
                        {o.note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                    <button
                      type="button"
                      onClick={() => setChatOfferId(o.id)}
                      className="btn-secondary text-xs"
                      disabled={hasContract}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Negociar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(o.id)}
                      className="btn-secondary text-xs"
                      disabled={hasContract}
                    >
                      <X className="w-3.5 h-3.5" />
                      Recusar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccept(o.id)}
                      className="btn-primary text-xs"
                      disabled={hasContract}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aceitar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {offers.some((o) => o.status !== "PENDENTE") && (
        <section className="card p-5">
          <h3 className="font-semibold text-steel-900 text-sm mb-2">Histórico</h3>
          <ul className="text-xs text-steel-600 space-y-1">
            {offers
              .filter((o) => o.status !== "PENDENTE")
              .map((o) => (
                <li key={o.id}>
                  {db.orgs.find((org) => org.id === o.supplier_org_id)?.fantasia} —{" "}
                  <span className="font-mono">{brl(o.product_price_brl + o.freight_price_brl)}</span> —{" "}
                  <span className={o.status === "ACEITA" ? "text-emerald-700" : "text-steel-500"}>
                    {o.status}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {hasContract && (
        <div className="flex justify-end">
          <button
            onClick={() =>
              navigate(`/contract/${db.contracts.find((c) => c.demand_id === id)!.id}`)
            }
            className="btn-primary"
          >
            <FileSignature className="w-4 h-4" />
            Ir para contrato
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <NegotiationChatModal
        open={chatOfferId !== null}
        onOpenChange={(next) => !next && setChatOfferId(null)}
        offerId={chatOfferId ?? ""}
        actingAs="buyer"
      />
    </div>
  );
}

function fmtRemain(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
