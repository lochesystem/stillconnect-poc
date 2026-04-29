import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Hourglass,
  MapPin,
  Package,
  Pen,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { useDB } from "../components/useDB";
import { concludeIfWindowExpired, deliver, forceConclude } from "../mock/services";
import { brl, dt } from "../lib/format";

export default function Logistics() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const contract = db.contracts.find((c) => c.id === id);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // tenta concluir automaticamente se a janela 72h expirou
  useEffect(() => {
    if (contract) concludeIfWindowExpired(contract.id);
  }, [now, contract?.id]);

  if (!contract) {
    return <div className="card p-8 text-center text-steel-500">Contrato não encontrado.</div>;
  }

  const supplier = db.orgs.find((o) => o.id === contract.supplier_id);
  const carrier = db.orgs.find((o) => o.id === contract.carrier_id);

  const isPickedUp = !!contract.delivery_token_hash;
  const isDelivered = !!contract.delivered_at;
  const isConcluded = contract.state === "CONTRATO_CONCLUIDO";

  const windowEnds = contract.window_ends_at ? new Date(contract.window_ends_at).getTime() : null;
  const remainingMs = windowEnds ? Math.max(0, windowEnds - now) : null;
  const totalMs = 30000;
  const windowPct = remainingMs == null ? 0 : 100 - (remainingMs / totalMs) * 100;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/contract/${contract.id}`)}
        className="btn-ghost text-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Contrato
      </button>

      <header>
        <div className="flex items-center gap-2 text-sm text-steel-500 font-medium">
          <Truck className="w-4 h-4" /> Logística com prova criptográfica
        </div>
        <h1 className="text-2xl font-bold text-steel-900 mt-0.5">
          App offline-first · GPS + assinatura + hash
        </h1>
      </header>

      <section className="card p-0 overflow-hidden" data-tour="map">
        <div className="relative h-44 bg-gradient-to-br from-steel-100 to-steel-200 dot-grid">
          <div className="absolute inset-0 flex items-center justify-between px-6 text-steel-500 text-xs font-medium">
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" /> CD do Fornecedor · {supplier?.uf}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {/* destination */}{" "}
              Cliente · São Paulo
            </div>
          </div>
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-steel-300/60 rounded-full" />
          {!isConcluded && isPickedUp && (
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0">
              <div
                className={`inline-block animate-drive ${
                  isDelivered ? "opacity-50" : ""
                }`}
              >
                <Truck className="w-6 h-6 text-molten-600 drop-shadow" />
              </div>
            </div>
          )}
          {!isPickedUp && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="badge-warning">
                <Hourglass className="w-3 h-3" /> Aguardando token de carga
              </span>
            </div>
          )}
          {isDelivered && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="bg-emerald-500 text-white rounded-full p-2 shadow-lg shadow-emerald-500/40 animate-pop-in">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <Step
            done={isPickedUp}
            current={!isPickedUp}
            title="Coleta autorizada"
            desc={
              isPickedUp
                ? `Token: ${contract.delivery_token_hash?.slice(0, 16)}…`
                : "Aguardando token criptográfico"
            }
            icon={Pen}
          />
          <Step
            done={isDelivered}
            current={isPickedUp && !isDelivered}
            title="Entregue"
            desc={
              isDelivered
                ? `Em ${dt(contract.delivered_at!)} · GPS + assinatura digital`
                : "Aguardando confirmação física"
            }
            icon={Truck}
          />
          <Step
            done={isConcluded}
            current={isDelivered && !isConcluded}
            title="Janela 72h"
            desc={
              isConcluded
                ? "Concluído · split realizado"
                : isDelivered
                ? "Silêncio = aceite automático"
                : "Não iniciada"
            }
            icon={Clock}
          />
        </div>
      </section>

      {!isPickedUp && contract.payment_state === "PGTO_EM_ESCROW" && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-steel-900">Token de carga ainda não emitido</h3>
          </div>
          <p className="text-sm text-steel-600">
            O escrow está validado mas o token não foi gerado. Volte para a tela de
            Escrow e finalize a trava fiscal.
          </p>
        </div>
      )}

      {isPickedUp && !isDelivered && (
        <div className="card p-5 flex items-center gap-3 justify-between flex-wrap">
          <div>
            <h3 className="font-semibold text-steel-900">Caminhão em trânsito</h3>
            <p className="text-sm text-steel-600">
              {carrier?.fantasia} a caminho de São Paulo. ETA simulada: 1m20s.
            </p>
          </div>
          <button
            onClick={() => deliver(contract.id)}
            className="btn-primary"
            data-tour="confirm-delivery"
          >
            Simular entrega
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {isDelivered && !isConcluded && remainingMs != null && (
        <div className="card p-5" data-tour="window-72h">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-steel-900">
                Janela de 72h em curso
              </h3>
              <p className="text-xs text-steel-500">
                Demo: 30s simulam 72h. Comprador pode contestar ou ficar em silêncio.
              </p>
            </div>
            <div className="font-mono text-xl font-bold text-amber-600">
              {String(Math.floor(remainingMs / 1000)).padStart(2, "0")}s restantes
            </div>
          </div>
          <div className="h-2 bg-steel-100 rounded overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${windowPct}%` }}
            />
          </div>

          <div className="flex justify-end mt-3">
            <button
              onClick={() => forceConclude(contract.id)}
              className="btn-secondary text-xs"
              data-tour="skip-window"
            >
              <Sparkles className="w-3 h-3" />
              Pular janela (demo)
            </button>
          </div>
        </div>
      )}

      {isConcluded && (
        <Conclusion
          contract={contract}
          supplierName={supplier?.fantasia ?? "—"}
          carrierName={carrier?.fantasia ?? "—"}
        />
      )}
    </div>
  );
}

function Step({
  title,
  desc,
  icon: Icon,
  done,
  current,
}: {
  title: string;
  desc: string;
  icon: typeof Truck;
  done: boolean;
  current: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        done
          ? "border-emerald-300 bg-emerald-50/60"
          : current
          ? "border-molten-400 bg-molten-50/40 animate-pulse-soft"
          : "border-steel-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center ${
            done
              ? "bg-emerald-500 text-white"
              : current
              ? "bg-molten-600 text-white"
              : "bg-steel-200 text-steel-500"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="font-semibold text-steel-900 text-sm">{title}</div>
      </div>
      <div className="text-xs text-steel-500 mt-1.5 leading-snug">{desc}</div>
    </div>
  );
}

function Conclusion({
  contract,
  supplierName,
  carrierName,
}: {
  contract: import("../mock/types").Contract;
  supplierName: string;
  carrierName: string;
}) {
  const splitTotal = contract.product_price_brl + contract.freight_price_brl;
  return (
    <section
      className="card p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white animate-pop-in"
      data-tour="conclusion"
    >
      <div className="flex items-center gap-2 mb-3 text-emerald-100 font-semibold uppercase text-xs tracking-widest">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Contrato concluído · split automático
      </div>
      <h3 className="text-xl font-bold">Dinheiro liberado pelo banco em centavos</h3>
      <p className="text-sm text-emerald-100 mt-1">
        Comprador permaneceu em silêncio na janela de 72h. Sistema considerou a entrega
        aceita e disparou o split em uma única transação atômica.
      </p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SplitCard
          label={supplierName}
          role="Fornecedor"
          value={contract.product_price_brl}
        />
        <SplitCard label={carrierName} role="Transportadora" value={contract.freight_price_brl} />
        <SplitCard label="Still Connect" role="Take rate" value={contract.fee_brl} />
      </div>

      <div className="mt-4 text-xs text-emerald-200">
        Total movimentado: <strong className="font-mono">{brl(splitTotal + contract.fee_brl)}</strong> ·
        Take rate efetivo: {((contract.fee_brl / splitTotal) * 100).toFixed(2)}%
      </div>
    </section>
  );
}

function SplitCard({ label, role, value }: { label: string; role: string; value: number }) {
  return (
    <div className="bg-white/15 rounded-lg p-3 backdrop-blur">
      <div className="text-[10px] uppercase tracking-widest text-emerald-100 font-semibold">
        {role}
      </div>
      <div className="font-semibold mt-0.5 truncate">{label}</div>
      <div className="font-mono text-lg font-extrabold mt-0.5">{brl(value)}</div>
    </div>
  );
}
