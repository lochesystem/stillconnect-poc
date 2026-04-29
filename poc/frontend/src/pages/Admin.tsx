import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Cog,
  FileText,
  Users,
} from "lucide-react";
import { useDB } from "../components/useDB";
import { brl, dt } from "../lib/format";
import { getStats } from "../mock/services";

const HEARTBEATS = [
  {
    label: "GMV última 1h",
    value: "R$ 187k",
    delta: "+12%",
    tone: "emerald",
    icon: BarChart3,
  },
  {
    label: "Conversão de leilão",
    value: "78%",
    delta: "estável",
    tone: "sky",
    icon: Activity,
  },
  {
    label: "Cadastros nas últimas 3h",
    value: "5",
    delta: "+2",
    tone: "emerald",
    icon: Users,
  },
  {
    label: "Webhook bancário p99",
    value: "1.2s",
    delta: "ok",
    tone: "emerald",
    icon: CheckCircle2,
  },
];

export default function Admin() {
  const db = useDB();
  const stats = getStats();

  const orgs = {
    BUYER: db.orgs.filter((o) => o.kind === "BUYER").length,
    SUPPLIER: db.orgs.filter((o) => o.kind === "SUPPLIER").length,
    CARRIER: db.orgs.filter((o) => o.kind === "CARRIER").length,
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-steel-500 font-medium">
          <Cog className="w-4 h-4" /> Admin Still Connect · Operations
        </div>
        <h1 className="text-2xl font-bold text-steel-900 mt-0.5">
          Visão de plataforma · Business Heartbeat
        </h1>
        <p className="text-sm text-steel-600 mt-1">
          Métricas em tempo real. Alertas ativos. Audit log append-only.
        </p>
      </header>

      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        data-tour="heartbeat"
      >
        {HEARTBEATS.map((h) => (
          <div key={h.label} className="card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h.icon className="w-4 h-4 text-steel-400" />
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  h.tone === "emerald" ? "text-emerald-700" : "text-sky-700"
                }`}
              >
                {h.delta}
              </span>
            </div>
            <div className="font-mono text-2xl font-extrabold text-steel-900 mt-2">
              {h.value}
            </div>
            <div className="text-[11px] text-steel-500 mt-0.5">{h.label}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2" data-tour="dashboard-stats">
          <h2 className="font-semibold text-steel-900 mb-3">Plataforma — agregados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Stat label="Demandas" value={String(stats.total_demands)} />
            <Stat label="Contratos" value={String(stats.contracts_total)} />
            <Stat label="Concluídos" value={String(stats.contracts_concluded)} />
            <Stat label="Em curso" value={String(stats.contracts_in_flight)} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <BigStat label="GMV total" value={brl(stats.total_gmv_brl)} />
            <BigStat
              label="Take rate (fees acumulados)"
              value={brl(stats.total_fees_brl)}
              tone="emerald"
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <PartyCount kind="Compradores" value={orgs.BUYER} />
            <PartyCount kind="Fornecedores" value={orgs.SUPPLIER} />
            <PartyCount kind="Transportadoras" value={orgs.CARRIER} />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-steel-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertas ativos
          </h2>
          <ul className="space-y-2 text-sm">
            <Alert
              tone="amber"
              text="2 demandas próximas de expiração sem matches suficientes."
            />
            <Alert
              tone="emerald"
              text="Banco parceiro: SLA p99 dentro da meta."
            />
            <Alert
              tone="sky"
              text="Time-window de disputa: 0 abertas em 7 dias."
            />
          </ul>
          <div className="mt-4 pt-3 border-t border-steel-200/60 text-xs text-steel-500 italic">
            Kill Switch e God Mode disponíveis apenas para SUPER_ADMIN com SLA de 24h.
          </div>
        </div>
      </section>

      <section className="card p-5" data-tour="audit-log">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-steel-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-steel-500" />
            Audit log (append-only)
          </h2>
          <span className="badge-neutral text-[10px]">
            {stats.audit_entries} eventos
          </span>
        </div>
        {db.audit.length === 0 ? (
          <p className="text-sm text-steel-500 italic">Sem eventos ainda.</p>
        ) : (
          <ul className="divide-y divide-steel-200/60 -mx-2">
            {db.audit.slice(0, 12).map((a) => (
              <li
                key={a.id}
                className="px-2 py-2 flex items-start gap-3 text-sm hover:bg-steel-50"
              >
                <span className="font-mono text-[10px] text-steel-500 mt-0.5 w-24 shrink-0">
                  {dt(a.ts)}
                </span>
                <span className="badge-info font-mono text-[10px] shrink-0">
                  {a.action}
                </span>
                <span className="text-steel-700 truncate">
                  <span className="text-steel-500">{a.entity}</span>{" "}
                  <span className="font-mono text-xs">{a.entity_id}</span>{" "}
                  {Object.keys(a.metadata).length > 0 && (
                    <span className="text-steel-500">
                      ·{" "}
                      {Object.entries(a.metadata)
                        .map(([k, v]) => `${k}=${typeof v === "object" ? "…" : v}`)
                        .slice(0, 3)
                        .join(" · ")}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-steel-50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">
        {label}
      </div>
      <div className="font-mono text-lg font-bold text-steel-900 mt-0.5">{value}</div>
    </div>
  );
}

function BigStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald";
}) {
  return (
    <div
      className={`rounded-lg p-3 ${
        tone === "emerald"
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-steel-900 text-white"
      }`}
    >
      <div
        className={`text-[10px] uppercase tracking-widest font-semibold ${
          tone === "emerald" ? "text-emerald-700" : "text-steel-400"
        }`}
      >
        {label}
      </div>
      <div
        className={`font-mono text-xl font-extrabold mt-0.5 ${
          tone === "emerald" ? "text-emerald-800" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function PartyCount({ kind, value }: { kind: string; value: number }) {
  return (
    <div className="rounded-md border border-steel-200 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">
        {kind}
      </div>
      <div className="font-bold text-steel-900 mt-0.5">{value}</div>
    </div>
  );
}

function Alert({ tone, text }: { tone: "amber" | "emerald" | "sky"; text: string }) {
  const cls =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-sky-200 bg-sky-50 text-sky-900";
  return (
    <li className={`rounded-md border px-3 py-2 ${cls}`}>{text}</li>
  );
}
