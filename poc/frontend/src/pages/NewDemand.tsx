import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, EyeOff, ShieldCheck } from "lucide-react";
import { createDemand } from "../mock/services";
import { brl } from "../lib/format";
import type { NegotiationMode } from "../mock/types";

export default function NewDemand() {
  const navigate = useNavigate();
  const [product, setProduct] = useState("Vergalhão CA-50");
  const [norm, setNorm] = useState("ABNT NBR 7480");
  const [volume, setVolume] = useState(20000);
  const [city, setCity] = useState("São Paulo");
  const [uf, setUf] = useState("SP");
  const [deadline, setDeadline] = useState(7);
  const [target, setTarget] = useState(140000);
  const [negotiationMode, setNegotiationMode] = useState<NegotiationMode>("AUCTION");
  const [offerWindowDays, setOfferWindowDays] = useState(7);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const dem = createDemand({
      product,
      norm,
      volume_kg: volume,
      delivery_city: city,
      delivery_uf: uf,
      deadline_days: deadline,
      target_price_brl: target,
      negotiation_mode: negotiationMode,
      offer_window_days: offerWindowDays,
    });
    navigate(`/buyer/demand/${dem.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost text-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar
      </button>

      <div>
        <div className="text-sm text-steel-500 font-medium">Nova demanda</div>
        <h1 className="text-2xl font-bold text-steel-900">Publicar no marketplace anônimo</h1>
        <p className="text-sm text-steel-600 mt-1 max-w-2xl">
          O sistema anonimiza sua identidade e esconde o preço-alvo. Fornecedores e
          transportadoras vão ver os requisitos sem saber sua razão social ou orçamento máximo.
        </p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-5">
        <Field label="Produto">
          <input
            data-tour="field-product"
            className="input"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Norma técnica">
            <input
              data-tour="field-norm"
              className="input"
              value={norm}
              onChange={(e) => setNorm(e.target.value)}
              required
            />
          </Field>
          <Field label="Volume (kg)">
            <input
              data-tour="field-volume"
              type="number"
              className="input"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              min={1}
              required
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Cidade de entrega" className="col-span-2">
            <input
              data-tour="field-city"
              className="input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </Field>
          <Field label="UF">
            <input
              data-tour="field-uf"
              className="input"
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
              required
            />
          </Field>
        </div>
        <Field label="Prazo de entrega (dias)">
          <input
            data-tour="field-deadline"
            type="number"
            className="input"
            value={deadline}
            onChange={(e) => setDeadline(Number(e.target.value))}
            min={1}
            required
          />
        </Field>

        <div className="rounded-lg border border-steel-200/80 bg-steel-50/50 p-4 space-y-3">
          <div className="text-xs font-semibold text-steel-700 uppercase tracking-wide">
            Modo de negociação
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-start gap-2 cursor-pointer rounded-md border border-steel-200 bg-white px-3 py-2 flex-1">
              <input
                type="radio"
                name="neg-mode"
                className="mt-1 accent-molten-600"
                checked={negotiationMode === "AUCTION"}
                onChange={() => setNegotiationMode("AUCTION")}
              />
              <span>
                <span className="font-semibold text-steel-900">Micro-leilão reverso</span>
                <span className="block text-xs text-steel-500 mt-0.5">
                  Modo canônico da especificação: produto e frete em salas paralelas ao vivo.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer rounded-md border border-steel-200 bg-white px-3 py-2 flex-1">
              <input
                type="radio"
                name="neg-mode"
                className="mt-1 accent-molten-600"
                checked={negotiationMode === "OFFERS"}
                onChange={() => setNegotiationMode("OFFERS")}
              />
              <span>
                <span className="font-semibold text-steel-900">Coleta de ofertas (RFQ)</span>
                <span className="block text-xs text-steel-500 mt-0.5">
                  Fornecedores enviam preço produto + frete; você aceita uma proposta (POC alternativa).
                </span>
              </span>
            </label>
          </div>
          {negotiationMode === "OFFERS" ? (
            <Field label="Janela para ofertas (dias)">
              <input
                type="number"
                className="input max-w-[140px]"
                value={offerWindowDays}
                onChange={(e) => setOfferWindowDays(Number(e.target.value))}
                min={1}
                max={90}
                required
              />
              <p className="text-[11px] text-steel-500 mt-1">
                Após abrir a coleta, fornecedores selecionados podem enviar ou atualizar oferta até este prazo.
              </p>
            </Field>
          ) : null}
        </div>

        <div
          className="rounded-lg border-2 border-dashed border-molten-300 bg-molten-50/40 p-4"
          data-tour="field-target-area"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-molten-700 mb-2 uppercase tracking-wide">
            <EyeOff className="w-3.5 h-3.5" />
            Preço-alvo confidencial
          </div>
          <div className="grid grid-cols-3 items-center gap-3">
            <div className="col-span-2">
              <input
                data-tour="field-target"
                type="number"
                className="input"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                min={1}
                step="any"
                required
              />
            </div>
            <div className="text-right">
              <div className="font-mono text-steel-900 font-semibold">{brl(target)}</div>
              <div className="text-[10px] text-steel-500 mt-0.5 leading-tight">
                Visível apenas para você + auditoria
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <ShieldCheck className="w-4 h-4" />
          <span>
            Dados sensíveis são cifrados antes de gravar. Demanda publicada em modo
            anônimo. Identidade revelada após abrir negociação (leilão ou coleta de ofertas).
          </span>
        </div>

        <div className="flex items-center gap-2 justify-end pt-2 border-t border-steel-200/60">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" data-tour="submit-demand">
            Publicar demanda
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="label block mb-1">{label}</span>
      {children}
    </label>
  );
}
