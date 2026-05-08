import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  EyeOff,
  Gavel,
  LayoutGrid,
  Lock,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useTour } from "../tour/TourController";

export default function Home() {
  const tour = useTour();

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-steel-900 via-steel-800 to-steel-950 text-white px-8 py-12 sm:py-16">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-molten-600/15 text-molten-300 border border-molten-500/20 rounded-full px-3 py-1 text-xs font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-molten-400 animate-pulse-soft" />
            POC · pitch demo
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            A infraestrutura que faz o mercado de aço{" "}
            <span className="text-molten-400">competir de verdade</span>.
          </h1>
          <p className="mt-5 text-lg text-steel-200 leading-relaxed">
            Compradores, fornecedores e transportadoras negociam num{" "}
            <strong className="text-white">micro-leilão reverso</strong> com escrow,
            trava fiscal e prova criptográfica. O usuário sente que está negociando.
            O sistema garante que dinheiro, mercado e risco estão sob controle.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={() => tour.start()} className="btn-primary text-base px-5 py-3">
              <Activity className="w-4 h-4" />
              Iniciar tour de 60s
            </button>
            <Link to="/buyer" className="btn-secondary text-base px-5 py-3">
              Explorar manualmente
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <blockquote className="mt-10 text-sm italic text-steel-300 border-l-2 border-molten-500 pl-3 max-w-xl">
            "A Steel Connect parece simples porque o sistema faz o trabalho pesado."
          </blockquote>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-steel-500 mb-4">
          O fluxo que você vai ver
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Step
            n={1}
            title="Demanda anônima"
            icon={EyeOff}
            text="Comprador publica o que precisa. Preço-alvo confidencial. Mercado descobre sem saber quem é."
          />
          <Step
            n={2}
            title="Match + seleção"
            icon={LayoutGrid}
            text="Fornecedores e transportadoras dão match. Comprador escolhe quem entra no leilão (score + selos)."
          />
          <Step
            n={3}
            title="Micro-leilão reverso"
            icon={Gavel}
            text="Sala privada, lances decrescentes, soft close. Dois leilões em paralelo: produto + frete."
            highlight
          />
          <Step
            n={4}
            title="Escrow + Trava Fiscal"
            icon={Lock}
            text="Banco trava 100% do valor. NF do fornecedor é validada vs escrow (tolerância R$ 1)."
          />
          <Step
            n={5}
            title="Logística com prova"
            icon={Truck}
            text="App offline-first. Geolocalização + assinatura + hash. Realidade física vence intenção digital."
          />
          <Step
            n={6}
            title="Janela 72h e split"
            icon={CheckCircle2}
            text="Silêncio = aceite. Pagamento liberado em split automático para fornecedor + transportadora + Steel Connect."
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="GMV alvo MVP (90 dias)" value="R$ 5M" />
        <Stat label="Spread reduzido vs telefônico" value=">2 p.p." />
        <Stat label="Disputa rate alvo" value="<5%" />
      </section>

      <section className="card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-steel-500 mb-3">
          Princípios da Bíblia Técnica
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Principle
            icon={ShieldCheck}
            text="Todo dinheiro é stateful. FSM rigorosa em pagamento, contrato, logística."
          />
          <Principle
            icon={EyeOff}
            text="Todo usuário é potencialmente malicioso. Idempotência obrigatória, audit append-only."
          />
          <Principle
            icon={Gavel}
            text="O servidor é a única autoridade de tempo. Soft close server-side. UTC interno."
          />
          <Principle
            icon={Briefcase}
            text="Realidade física comprovada prevalece sobre intenções digitais (tolerância 6h)."
          />
        </div>
      </section>
    </div>
  );
}

function Step({
  n,
  title,
  text,
  icon: Icon,
  highlight,
}: {
  n: number;
  title: string;
  text: string;
  icon: typeof Activity;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card p-5 relative ${
        highlight ? "ring-2 ring-molten-500/40 bg-gradient-to-br from-white to-molten-50" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
            highlight ? "bg-molten-600 text-white" : "bg-steel-100 text-steel-700"
          }`}
        >
          {n}
        </div>
        <Icon className={`w-4 h-4 ${highlight ? "text-molten-600" : "text-steel-500"}`} />
        <h3 className="font-semibold text-steel-900">{title}</h3>
      </div>
      <p className="text-sm text-steel-600 leading-relaxed">{text}</p>
      {highlight && (
        <div className="absolute -top-2 -right-2 bg-molten-600 text-white text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full shadow">
          Highlight
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wider text-steel-500 font-semibold">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-steel-900 font-mono">{value}</div>
    </div>
  );
}

function Principle({ icon: Icon, text }: { icon: typeof Activity; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-molten-600 mt-0.5 shrink-0" />
      <span className="text-steel-700">{text}</span>
    </div>
  );
}
