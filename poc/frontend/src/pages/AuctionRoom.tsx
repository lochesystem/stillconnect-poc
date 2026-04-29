import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Clock,
  Flame,
  Gavel,
  TrendingDown,
  Trophy,
  Truck,
  Zap,
} from "lucide-react";
import { useDB } from "../components/useDB";
import {
  endAuction,
  listAuctionsFor,
  listBidsFor,
  listMatchesFor,
  placeBid,
  tryGenerateContract,
} from "../mock/services";
import { brl } from "../lib/format";
import type { Auction, Bid } from "../mock/types";

export default function AuctionRoom() {
  const { demandId = "" } = useParams();
  const navigate = useNavigate();
  const db = useDB();

  const auctions = useMemo(() => listAuctionsFor(demandId), [db, demandId]);
  const product = auctions.find((a) => a.lane === "PRODUCT");
  const freight = auctions.find((a) => a.lane === "FREIGHT");

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  // bot lances simulados
  const botTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!product || !freight) return;
    if (botTimerRef.current !== null) clearInterval(botTimerRef.current);

    function tick() {
      const dbNow = listAuctionsFor(demandId);
      for (const auc of dbNow) {
        if (auc.status !== "LEILAO_ATIVO" && auc.status !== "LEILAO_OVERTIME") continue;

        const remaining = new Date(auc.ends_at).getTime() - Date.now();
        if (remaining <= 0) continue;

        // probabilidade de lance: maior quanto mais perto do fim
        const tension = Math.max(0.18, Math.min(0.85, 1 - remaining / 30000));
        if (Math.random() > tension) continue;

        const matches = listMatchesFor(demandId).filter(
          (m) =>
            m.selected &&
            ((auc.lane === "PRODUCT" && m.org_kind === "SUPPLIER") ||
              (auc.lane === "FREIGHT" && m.org_kind === "CARRIER")),
        );
        if (matches.length === 0) continue;
        const candidate = matches[Math.floor(Math.random() * matches.length)];

        // não permite mesmo bidder dar lance consecutivo se já é o melhor
        if (candidate.org_id === auc.best_bidder_id) continue;

        const drop = 0.005 + Math.random() * 0.012; // 0.5% - 1.7% drop
        const newAmount = Math.max(
          Math.round(auc.start_price_brl * 0.55 * 100) / 100,
          Math.round(auc.current_best_brl * (1 - drop) * 100) / 100,
        );
        if (newAmount >= auc.current_best_brl) continue;
        placeBid(auc.id, candidate.org_id, newAmount, false);
      }
    }
    const id = window.setInterval(tick, 1100);
    botTimerRef.current = id;
    return () => {
      if (botTimerRef.current !== null) clearInterval(botTimerRef.current);
    };
  }, [product?.id, freight?.id, demandId]);

  // auto-encerramento
  const [contractGenerated, setContractGenerated] = useState(false);
  useEffect(() => {
    if (!product || !freight) return;
    for (const auc of [product, freight]) {
      const remaining = new Date(auc.ends_at).getTime() - now;
      if (
        remaining <= 0 &&
        (auc.status === "LEILAO_ATIVO" || auc.status === "LEILAO_OVERTIME")
      ) {
        endAuction(auc.id);
      }
    }
    const aucsNow = listAuctionsFor(demandId);
    if (aucsNow.length === 2 && aucsNow.every((a) => a.status === "LEILAO_ENCERRADO")) {
      const c = tryGenerateContract(demandId);
      if (c) setContractGenerated(true);
    }
  }, [now, product, freight, demandId]);

  if (!product || !freight) {
    return (
      <div className="card p-8 text-center text-steel-500">
        Leilão não iniciado para esta demanda.
      </div>
    );
  }

  const productEnded = product.status === "LEILAO_ENCERRADO";
  const freightEnded = freight.status === "LEILAO_ENCERRADO";

  return (
    <div className="space-y-6">
      <header className="flex items-start sm:items-end flex-col sm:flex-row sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-sm text-steel-500 font-medium">
            <Gavel className="w-4 h-4" /> Sala de leilão · privada · server-time UTC
          </div>
          <h1 className="text-2xl font-bold text-steel-900 mt-0.5 flex items-center gap-2">
            Micro-leilão reverso
            <span className="text-xs font-normal text-steel-500">
              (lances apenas decrescentes · soft close ativo)
            </span>
          </h1>
        </div>
        {contractGenerated && (
          <button
            onClick={() => navigate(`/contract/from-demand/${demandId}`)}
            className="btn-primary animate-pop-in"
            data-tour="goto-contract"
          >
            Gerar contrato
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Lane
          auction={product}
          title="LEILÃO DE PRODUTO"
          subtitle="Vergalhão CA-50"
          icon={Briefcase}
          tour="lane-product"
        />
        <Lane
          auction={freight}
          title="LEILÃO DE FRETE"
          subtitle="Carga industrial"
          icon={Truck}
          tour="lane-freight"
        />
      </div>

      {(productEnded || freightEnded) && (
        <div className="card p-5 bg-gradient-to-br from-steel-900 to-steel-950 text-steel-100">
          <div className="flex items-center gap-2 text-molten-400 font-semibold uppercase text-xs tracking-widest mb-2">
            <Trophy className="w-3.5 h-3.5" /> Resultado
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Result a={product} db={db} label="Produto" />
            <Result a={freight} db={db} label="Frete" />
          </div>
          {!contractGenerated &&
            (productEnded || freightEnded) &&
            !(productEnded && freightEnded) && (
              <p className="text-xs text-steel-400 mt-3 italic">
                Aguardando o segundo leilão encerrar para gerar contrato unificado…
              </p>
            )}
        </div>
      )}
    </div>
  );
}

function Lane({
  auction,
  title,
  subtitle,
  icon: Icon,
  tour,
}: {
  auction: Auction;
  title: string;
  subtitle: string;
  icon: typeof Briefcase;
  tour: string;
}) {
  const db = useDB();
  const bids = listBidsFor(auction.id);
  const remaining = Math.max(0, new Date(auction.ends_at).getTime() - Date.now());
  const seconds = Math.ceil(remaining / 1000);
  const totalDuration = 35;
  const progressPct = Math.min(
    100,
    Math.max(0, ((totalDuration * 1000 - remaining) / (totalDuration * 1000)) * 100),
  );
  const overtime = auction.status === "LEILAO_OVERTIME";
  const ended = auction.status === "LEILAO_ENCERRADO";
  const [bidValue, setBidValue] = useState<number>(0);

  useEffect(() => {
    setBidValue(Math.max(0, Math.round((auction.current_best_brl - 50) * 100) / 100));
  }, [auction.current_best_brl, auction.id]);

  function handleBid() {
    const buyer = db.orgs.find((o) => o.id === db.current_buyer_id);
    if (!buyer) return;
    // o "investidor" (você) joga como um fornecedor extra simulado
    const userOrg = db.orgs.find((o) => o.kind === (auction.lane === "PRODUCT" ? "SUPPLIER" : "CARRIER"));
    if (!userOrg) return;
    const result = placeBid(auction.id, userOrg.id, bidValue, true);
    if (!result.ok) {
      alert(result.reason || "Lance inválido");
    }
  }

  const winner = ended
    ? db.orgs.find((o) => o.id === auction.best_bidder_id)
    : null;

  return (
    <article
      className={`card overflow-hidden transition-all ${
        overtime ? "ring-2 ring-amber-400 shadow-lg shadow-amber-500/10" : ""
      } ${ended ? "opacity-95" : ""}`}
      data-tour={tour}
    >
      <div className="px-5 py-4 border-b border-steel-200/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-steel-500" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-steel-500">
              {title}
            </div>
            <div className="font-semibold text-steel-900">{subtitle}</div>
          </div>
        </div>
        {!ended ? (
          <div className="flex items-center gap-2">
            {overtime && (
              <span className="badge-warning animate-pulse-soft">
                <Flame className="w-3 h-3" />
                OVERTIME
              </span>
            )}
            <span
              className={`flex items-center gap-1 font-mono font-bold text-lg ${
                seconds <= 5 ? "text-rose-600" : seconds <= 10 ? "text-amber-600" : "text-steel-900"
              }`}
            >
              <Clock className="w-4 h-4" />
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </span>
          </div>
        ) : (
          <span className="badge-success">
            <Trophy className="w-3 h-3" />
            ENCERRADO
          </span>
        )}
      </div>

      <div className="relative h-1 bg-steel-100">
        <div
          className={`absolute inset-y-0 left-0 ${
            overtime ? "bg-amber-500" : ended ? "bg-emerald-500" : "bg-molten-500"
          }`}
          style={{ width: `${progressPct}%`, transition: "width 220ms linear" }}
        />
      </div>

      <div className="p-5 space-y-3">
        <div>
          <div className="label">Melhor lance atual</div>
          <div
            className={`mt-1 font-mono text-3xl font-extrabold ${
              ended ? "text-emerald-700" : "text-steel-900"
            }`}
          >
            {brl(auction.current_best_brl)}
          </div>
          <div className="text-xs text-steel-500 mt-0.5 flex items-center gap-1">
            Partiu de <span className="font-mono">{brl(auction.start_price_brl)}</span>
            <TrendingDown className="w-3 h-3" />
            queda{" "}
            <span className="font-semibold text-emerald-700">
              {(
                ((auction.start_price_brl - auction.current_best_brl) /
                  auction.start_price_brl) *
                100
              ).toFixed(2)}
              %
            </span>
          </div>
        </div>

        {!ended && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              className="input flex-1 font-mono text-sm"
              value={bidValue || ""}
              onChange={(e) => setBidValue(Number(e.target.value))}
              step={50}
              max={auction.current_best_brl - 0.01}
              data-tour={`bid-input-${auction.lane}`}
            />
            <button
              onClick={handleBid}
              className="btn-primary"
              data-tour={`bid-cta-${auction.lane}`}
            >
              <Zap className="w-3.5 h-3.5" />
              Dar lance
            </button>
          </div>
        )}

        {winner && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-emerald-900 text-sm flex items-center gap-2 animate-pop-in">
            <Trophy className="w-4 h-4 text-emerald-600" />
            Vencedor: <strong>{winner.fantasia}</strong> em {brl(auction.current_best_brl)}
          </div>
        )}

        <div className="border-t border-steel-200/60 pt-3">
          <div className="label mb-1.5">Histórico de lances</div>
          <ul className="max-h-40 overflow-y-auto -mx-1">
            {bids.length === 0 ? (
              <li className="text-xs text-steel-500 px-1 italic">
                Aguardando primeiros lances…
              </li>
            ) : (
              bids.slice(0, 8).map((b, idx) => <BidRow key={b.id} bid={b} top={idx === 0} />)
            )}
          </ul>
        </div>
      </div>
    </article>
  );
}

function BidRow({ bid, top }: { bid: Bid; top: boolean }) {
  return (
    <li
      className={`flex items-center justify-between text-xs px-2 py-1.5 rounded ${
        top ? "bg-emerald-50/60" : ""
      } ${bid.is_user ? "ring-1 ring-molten-300/60" : ""}`}
    >
      <span
        className={`font-medium ${
          bid.is_user
            ? "text-molten-700"
            : top
            ? "text-emerald-800"
            : "text-steel-700"
        }`}
      >
        {bid.org_name}
      </span>
      <span className="font-mono font-semibold">
        {new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 2,
        }).format(bid.amount_brl)}
      </span>
    </li>
  );
}

function Result({
  a,
  db,
  label,
}: {
  a: Auction;
  db: ReturnType<typeof useDB>;
  label: string;
}) {
  const winner = db.orgs.find((o) => o.id === a.best_bidder_id);
  return (
    <div className="bg-steel-800/50 rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-widest text-steel-400 font-semibold">
        {label}
      </div>
      <div className="font-mono text-xl font-bold text-emerald-400 mt-0.5">
        {brl(a.current_best_brl)}
      </div>
      {winner && (
        <div className="text-sm text-steel-200 mt-1">
          {winner.fantasia} <span className="text-steel-400">· score {winner.score}</span>
        </div>
      )}
    </div>
  );
}
