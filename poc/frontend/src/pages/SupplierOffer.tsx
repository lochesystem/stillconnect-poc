import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Package, Target, Truck } from "lucide-react";
import { useDB } from "../components/useDB";
import { listMatchesFor, offersWindowOpen, submitOffer } from "../mock/services";
import { brl, dt, kg } from "../lib/format";

export default function SupplierOffer() {
  const { demandId = "" } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const supplierId = db.current_supplier_id;

  const demand = db.demands.find((d) => d.id === demandId);
  const matches = listMatchesFor(demandId);
  const supplierSelected = matches.some(
    (m) => m.org_kind === "SUPPLIER" && m.org_id === supplierId && m.selected,
  );
  const carrierOptions = useMemo(
    () =>
      matches.filter((m) => m.org_kind === "CARRIER" && m.selected).map((m) => {
        const org = db.orgs.find((o) => o.id === m.org_id);
        return { id: m.org_id, label: org?.fantasia ?? m.org_id };
      }),
    [matches, db.orgs],
  );

  const [productPrice, setProductPrice] = useState(0);
  const [freightPrice, setFreightPrice] = useState(0);
  const [carrierId, setCarrierId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!demand) return;
    setProductPrice((p) => (p === 0 ? Math.round(demand.target_price_brl * 1.08 * 100) / 100 : p));
    setFreightPrice((f) => (f === 0 ? Math.round(demand.target_price_brl * 0.065 * 100) / 100 : f));
  }, [demand]);

  useEffect(() => {
    if (carrierOptions.length && !carrierId) setCarrierId(carrierOptions[0].id);
  }, [carrierOptions, carrierId]);

  if (!demand) {
    return <div className="card p-8 text-center text-steel-500">Demanda não encontrada.</div>;
  }

  if (demand.negotiation_mode !== "OFFERS") {
    return (
      <div className="card p-8 text-center text-steel-500">
        Esta demanda não está em modo coleta de ofertas.
      </div>
    );
  }

  if (!supplierSelected) {
    return (
      <div className="card p-8 text-center text-steel-500">
        Você não está entre os fornecedores selecionados para esta demanda.
      </div>
    );
  }

  if (demand.status !== "DEMANDA_COLETANDO_OFERTAS") {
    return (
      <div className="card p-8 text-center text-steel-500">
        A coleta de ofertas ainda não foi aberta pelo comprador ou já foi encerrada.
      </div>
    );
  }

  const windowOk = offersWindowOpen(demand);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      submitOffer({
        demand_id: demandId,
        supplier_org_id: supplierId,
        carrier_org_id: carrierId,
        product_price_brl: productPrice,
        freight_price_brl: freightPrice,
        note,
      });
      navigate("/marketplace");
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button type="button" onClick={() => navigate("/marketplace")} className="btn-ghost text-sm">
        <ArrowLeft className="w-3.5 h-3.5" />
        Marketplace
      </button>

      <div className="card p-6 space-y-4">
        <div>
          <div className="text-xs text-steel-500 font-semibold uppercase tracking-widest">
            Enviar oferta
          </div>
          <h1 className="text-xl font-bold text-steel-900 mt-1 flex items-center gap-2">
            <Package className="w-5 h-5 text-molten-600" />
            {demand.product}
          </h1>
          <p className="text-sm text-steel-600 mt-1">
            {kg(demand.volume_kg)} · {demand.delivery_city}/{demand.delivery_uf} · entrega até{" "}
            {dt(demand.deadline)}
          </p>
          <p className="text-xs text-steel-500 mt-2">
            Ofertas até <strong>{dt(demand.offers_close_at)}</strong>
            {!windowOk ? " — prazo encerrado." : ""}
          </p>
          <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/70 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 uppercase tracking-wide">
              <Target className="w-3.5 h-3.5" />
              Preço-alvo do comprador (RFQ)
            </div>
            <div className="font-mono text-xl font-bold text-steel-900 mt-1">{brl(demand.target_price_brl)}</div>
            <p className="text-xs text-steel-600 mt-2 leading-relaxed">
              Diferente do leilão, neste modo o comprador informa esta referência para você montar a proposta (valor do produto + frete).{" "}
              Os valores sugeridos abaixo são apenas ponto de partida — ajuste como preferir.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-steel-200/60">
          <label className="block">
            <span className="label block mb-1">Preço produto (R$)</span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="input font-mono"
              value={productPrice || ""}
              onChange={(e) => setProductPrice(Number(e.target.value))}
              required
            />
          </label>
          <label className="block">
            <span className="label block mb-1">Preço frete proposto (R$)</span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="input font-mono"
              value={freightPrice || ""}
              onChange={(e) => setFreightPrice(Number(e.target.value))}
              required
            />
          </label>
          <label className="block">
            <span className="label block mb-1 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              Transportadora (entre as aprovadas pelo comprador)
            </span>
            {carrierOptions.length === 0 ? (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Não há transportadoras selecionadas pelo comprador nesta demanda — não é possível enviar oferta até ele completar a seleção (mín. 2).
              </p>
            ) : (
              <select
                className="input"
                value={carrierId}
                onChange={(e) => setCarrierId(e.target.value)}
                required
              >
                {carrierOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className="block">
            <span className="label block mb-1">Observações (opcional)</span>
            <textarea
              className="input min-h-[72px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </label>
          <div className="text-sm text-steel-600 font-mono">
            Total da proposta: <strong>{brl(productPrice + freightPrice)}</strong>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => navigate("/marketplace")}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={!windowOk || carrierOptions.length === 0}>
              Enviar oferta
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
