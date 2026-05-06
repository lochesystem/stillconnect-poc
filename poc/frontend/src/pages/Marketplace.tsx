import { Link } from "react-router-dom";
import { LayoutGrid, MapPin, Package, ShieldQuestion, ArrowRight } from "lucide-react";
import { useDB } from "../components/useDB";
import { listMatchesFor } from "../mock/services";
import { brl, dt, kg, relTime } from "../lib/format";

export default function Marketplace() {
  const db = useDB();

  const supplier = db.orgs.find((o) => o.id === db.current_supplier_id);
  const visibleDemands = db.demands.filter(
    (d) =>
      d.status === "DEMANDA_PUBLICADA" ||
      d.status === "DEMANDA_COM_MATCHES" ||
      d.status === "DEMANDA_EM_LEILAO" ||
      d.status === "DEMANDA_COLETANDO_OFERTAS",
  );

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-steel-500 font-medium">
          <LayoutGrid className="w-4 h-4" /> Marketplace anônimo · Visão Fornecedor
        </div>
        <h1 className="text-2xl font-bold text-steel-900 mt-0.5">
          {supplier?.fantasia || "Fornecedor"}
        </h1>
        <p className="text-sm text-steel-600 mt-1">
          Você vê requisitos. Não vê quem é o comprador. Não vê preço-alvo. Você decide se entra na competição.
        </p>
      </header>

      {visibleDemands.length === 0 ? (
        <div className="card p-12 text-center">
          <ShieldQuestion className="w-10 h-10 text-steel-400 mx-auto mb-3" />
          <div className="text-steel-700 font-medium">
            Nenhuma demanda pública no momento.
          </div>
          <p className="text-sm text-steel-500 mt-1">
            Quando um comprador publica, ela aparece aqui anonimizada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleDemands.map((d) => {
            const matches = listMatchesFor(d.id);
            const selected =
              d.negotiation_mode === "OFFERS" &&
              d.status === "DEMANDA_COLETANDO_OFERTAS" &&
              matches.some(
                (m) =>
                  m.org_kind === "SUPPLIER" &&
                  m.org_id === db.current_supplier_id &&
                  m.selected,
              );
            const rfqHint =
              d.negotiation_mode === "OFFERS" && d.status === "DEMANDA_COLETANDO_OFERTAS";
            return (
              <article
                key={d.id}
                className="card p-5 hover:shadow-md transition-shadow"
                data-tour={`market-${d.id}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-md bg-steel-900 text-molten-400 flex items-center justify-center font-mono text-xs">
                      ?
                    </div>
                    <div>
                      <div className="font-semibold text-steel-900 leading-tight">
                        Comprador anônimo
                      </div>
                      <div className="text-[11px] text-steel-500 leading-tight">
                        KYB ATIVO · score 8x
                      </div>
                    </div>
                  </div>
                  <span className="badge-info">{relTime(d.created_at)}</span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-steel-400" />
                    <span className="font-semibold text-steel-900">{d.product}</span>
                    <span className="text-steel-500">· {d.norm}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-steel-600">
                    <MapPin className="w-4 h-4 text-steel-400" />
                    Entrega em {d.delivery_city}/{d.delivery_uf} até {dt(d.deadline)}
                  </div>
                  <div className="text-sm text-steel-600">
                    Volume:{" "}
                    <span className="font-mono font-semibold text-steel-900">
                      {kg(d.volume_kg)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-steel-200/60 flex-wrap">
                  <div className="text-xs text-steel-500">
                    Preço-alvo:{" "}
                    <span className="font-mono tracking-widest text-steel-400 select-none">
                      •••••
                    </span>{" "}
                    (oculto)
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {selected ? (
                      <Link to={`/supplier/offer/${d.id}`} className="btn-primary text-xs py-1.5 px-3">
                        Enviar oferta
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : null}
                    {!rfqHint ? (
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded font-semibold">
                        ✓ Match automático
                      </span>
                    ) : (
                      <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded font-semibold">
                        RFQ · convidados enviam proposta
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-steel-500 italic flex items-start gap-1">
                  <ShieldQuestion className="w-3 h-3 mt-0.5 shrink-0" />
                  {rfqHint
                    ? "Coleta de ofertas: se você foi selecionado pelo comprador, pode propor produto + frete até o prazo indicado na tela de envio."
                    : "Identidade do comprador é revelada após o início do leilão ou da coleta de ofertas. Negociação ocorre em fluxo guiado."}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="card p-5 bg-steel-900 text-steel-100">
        <div className="text-xs uppercase tracking-widest text-molten-400 font-semibold mb-2">
          Por que tudo é anônimo aqui?
        </div>
        <p className="text-sm leading-relaxed">
          Mercado anônimo evita conluio entre fornecedores e captura de spread por
          relacionamento. Quando o leilão ou a coleta de ofertas começa, todos competem em condições
          mais parecidas por preço e prazo — não por quem conhece quem. Estimativa interna:{" "}
          <span className="text-emerald-400 font-mono font-semibold">
            redução média de 4,2 p.p.
          </span>{" "}
          no spread vs cotação telefônica.
        </p>
      </div>
    </div>
  );
}
