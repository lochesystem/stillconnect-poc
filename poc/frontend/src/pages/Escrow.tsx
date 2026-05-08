import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Lock,
  ShieldCheck,
  Truck,
  Upload,
  Wallet,
} from "lucide-react";
import { useDB } from "../components/useDB";
import { authorizePickup, uploadNF } from "../mock/services";
import { brl } from "../lib/format";

export default function Escrow() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const contract = db.contracts.find((c) => c.id === id);

  const [vNF, setVNF] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<{ approved: boolean; diff: number } | null>(
    null,
  );
  const [pickupHash, setPickupHash] = useState<string | null>(null);

  useEffect(() => {
    if (contract) {
      const total = contract.product_price_brl + contract.freight_price_brl + contract.fee_brl;
      // sugere valor com diferença de R$ 0,30 para ilustrar tolerância
      setVNF(Math.round((total - 0.3) * 100) / 100);
    }
  }, [contract?.id]);

  if (!contract) {
    return <div className="card p-8 text-center text-steel-500">Contrato não encontrado.</div>;
  }

  const total = contract.product_price_brl + contract.freight_price_brl + contract.fee_brl;
  const escrowed = contract.payment_state === "PGTO_EM_ESCROW";
  const inEscrowOrLater = ["PGTO_EM_ESCROW", "PGTO_LIBERADO"].includes(contract.payment_state);

  async function handleUpload() {
    const r = await uploadNF(contract!.id, vNF);
    setUploadResult({ approved: r.approved, diff: r.diff_brl });
    if (r.approved) {
      const hash = await authorizePickup(contract!.id);
      setPickupHash(hash);
    }
  }

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
          <Wallet className="w-4 h-4" /> Escrow + Trava Fiscal
        </div>
        <h1 className="text-2xl font-bold text-steel-900 mt-0.5">
          Banco trava 100% antes de qualquer movimento
        </h1>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className={`card p-6 relative overflow-hidden ${
            inEscrowOrLater ? "ring-2 ring-emerald-500/30" : ""
          }`}
          data-tour="escrow-vault"
        >
          <div className="absolute top-3 right-3">
            {escrowed ? (
              <span className="badge-success">
                <Lock className="w-3 h-3" />
                EM ESCROW
              </span>
            ) : (
              <span className="badge-warning">
                <AlertTriangle className="w-3 h-3" />
                AGUARDANDO NF
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                escrowed
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-steel-200 text-steel-600"
              }`}
            >
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="label">Cofre / banco parceiro</div>
              <div className="font-mono text-2xl font-extrabold text-steel-900">
                {brl(total)}
              </div>
            </div>
          </div>
          <ul className="text-xs text-steel-600 space-y-1.5 mt-4">
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Comprador depositou 100% do valor antes do início da logística
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Dinheiro fica retido até prova de entrega + janela de 72h
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Idempotência obrigatória em qualquer chamada financeira
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Eventos PAYMENTS_EVENTS append-only, auditáveis
            </li>
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Slice label="Produto" value={contract.product_price_brl} color="bg-molten-500" />
            <Slice label="Frete" value={contract.freight_price_brl} color="bg-emerald-500" />
            <Slice label="Fee Steel Connect" value={contract.fee_brl} color="bg-steel-700" />
          </div>
        </div>

        <div className="card p-6" data-tour="trava-fiscal">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-steel-500" />
            <h2 className="font-semibold text-steel-900">Trava Fiscal — NF × Escrow</h2>
          </div>
          <p className="text-xs text-steel-500 mb-4">
            Sistema lê <code className="font-mono">&lt;vNF&gt;</code> do XML e compara com o
            valor em escrow. Tolerância: <strong>R$ 1,00</strong>.
          </p>

          <label className="block">
            <span className="label block mb-1">Valor declarado na NF (R$)</span>
            <input
              type="number"
              step={0.01}
              value={vNF || ""}
              onChange={(e) => setVNF(Number(e.target.value))}
              className="input font-mono"
              data-tour="nf-input"
            />
          </label>
          <div className="text-xs text-steel-500 mt-1">
            Total em escrow:{" "}
            <span className="font-mono font-semibold text-steel-700">{brl(total)}</span>
          </div>

          <button
            onClick={handleUpload}
            disabled={escrowed}
            className="btn-primary w-full mt-3"
            data-tour="upload-nf"
          >
            <Upload className="w-4 h-4" />
            Enviar XML da NF
          </button>

          {uploadResult && (
            <div
              className={`mt-4 rounded-lg p-3 border animate-pop-in ${
                uploadResult.approved
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {uploadResult.approved ? (
                  <>
                    <Check className="w-4 h-4" /> Aprovação automática
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" /> Divergência → Waiver
                  </>
                )}
              </div>
              <div className="text-sm mt-1">
                Diferença: <strong className="font-mono">{brl(uploadResult.diff)}</strong>{" "}
                {uploadResult.approved
                  ? "(dentro da tolerância de R$ 1,00)"
                  : "(comprador decide em até 48h ou NF é reemitida)"}
              </div>
            </div>
          )}

          {pickupHash && (
            <div className="mt-3 rounded-lg bg-steel-900 text-steel-100 p-3 text-xs animate-slide-up">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-molten-400" />
                <span className="text-molten-400 font-semibold uppercase tracking-widest text-[10px]">
                  Token de carga emitido (SHA-256)
                </span>
              </div>
              <code className="font-mono text-[11px] break-all opacity-90 block">
                {pickupHash}
              </code>
              <div className="text-[10px] text-steel-400 mt-1.5">
                Transportadora autorizada a coletar a mercadoria.
              </div>
            </div>
          )}
        </div>
      </section>

      {escrowed && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/logistics/${contract.id}`)}
            className="btn-primary"
            data-tour="goto-logistics-from-escrow"
          >
            <Truck className="w-4 h-4" />
            Acompanhar entrega
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Slice({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md bg-steel-50 px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-[10px] uppercase tracking-wider text-steel-500 font-semibold">
          {label}
        </span>
      </div>
      <div className="font-mono text-sm font-semibold text-steel-900 mt-0.5">
        {brl(value)}
      </div>
    </div>
  );
}
