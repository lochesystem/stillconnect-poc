import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { tourSteps } from "./steps";
import type { TourCtx, TourStep } from "./types";
import { reseed } from "../mock/seed";
import { readDB } from "../mock/storage";

interface TourState {
  active: boolean;
  paused: boolean;
  cancelled: boolean;
  currentIdx: number;
  ctx: TourCtx;
}

interface TourAPI {
  state: TourState;
  steps: TourStep[];
  start: () => Promise<void>;
  stop: () => void;
  togglePause: () => void;
  next: () => void;
}

const TourContext = createContext<TourAPI | null>(null);

const initial: TourState = {
  active: false,
  paused: false,
  cancelled: false,
  currentIdx: 0,
  ctx: { demandId: null, contractId: null },
};

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<TourState>(initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const skipRequested = useRef(false);

  const wait = useCallback(async (ms: number) => {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (stateRef.current.cancelled) return "cancel";
      if (skipRequested.current) {
        skipRequested.current = false;
        return "skip";
      }
      if (stateRef.current.paused) {
        await new Promise((r) => setTimeout(r, 60));
        continue;
      }
      const remaining = ms - (Date.now() - start);
      await new Promise((r) => setTimeout(r, Math.min(60, remaining)));
    }
    return "ok";
  }, []);

  const dispatchClick = useCallback(async (selector: string, attempts = 25): Promise<boolean> => {
    for (let i = 0; i < attempts; i++) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        await new Promise((r) => setTimeout(r, 120));
        el.click();
        return true;
      }
      await new Promise((r) => setTimeout(r, 80));
      if (stateRef.current.cancelled) return false;
    }
    return false;
  }, []);

  const fillField = useCallback(async (selector: string, value: string) => {
    for (let i = 0; i < 25; i++) {
      const el = document.querySelector(selector) as HTMLInputElement | null;
      if (el) {
        el.focus();
        setNativeValue(el, value);
        return true;
      }
      await new Promise((r) => setTimeout(r, 60));
      if (stateRef.current.cancelled) return false;
    }
    return false;
  }, []);

  const captureLatestDemandId = useCallback(async (): Promise<string | null> => {
    for (let i = 0; i < 30; i++) {
      const db = readDB();
      if (db.demands.length > 0) {
        return db.demands[0].id;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    return null;
  }, []);

  const captureLatestContractId = useCallback(async (): Promise<string | null> => {
    for (let i = 0; i < 30; i++) {
      const db = readDB();
      if (db.contracts.length > 0) {
        return db.contracts[0].id;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    return null;
  }, []);

  const stop = useCallback(() => {
    skipRequested.current = false;
    setState({ ...initial, cancelled: true });
    setTimeout(() => setState(initial), 100);
  }, []);

  const togglePause = useCallback(() => {
    setState((s) => ({ ...s, paused: !s.paused }));
  }, []);

  const next = useCallback(() => {
    skipRequested.current = true;
  }, []);

  const start = useCallback(async () => {
    if (stateRef.current.active) return;
    skipRequested.current = false;
    setState({ ...initial, active: true, currentIdx: 0 });
    await reseed();
    await new Promise((r) => setTimeout(r, 250));

    let ctx: TourCtx = { demandId: null, contractId: null };

    for (let i = 0; i < tourSteps.length; i++) {
      if (stateRef.current.cancelled) return;

      const step = tourSteps[i];
      setState((s) => ({ ...s, currentIdx: i, ctx }));

      // navegação opcional
      if (step.path) {
        const path = typeof step.path === "function" ? step.path(ctx) : step.path;
        navigate(path);
        await new Promise((r) => setTimeout(r, 350));
      }

      // preencher campos
      if (step.fill) {
        for (const f of step.fill) {
          await fillField(f.selector, f.value);
          await new Promise((r) => setTimeout(r, 80));
        }
      }

      // step do form: preencher os campos da nova demanda automaticamente
      if (step.id === "fill-form") {
        await fillField('[data-tour="field-product"]', "Vergalhão CA-50");
        await new Promise((r) => setTimeout(r, 80));
        await fillField('[data-tour="field-norm"]', "ABNT NBR 7480");
        await new Promise((r) => setTimeout(r, 80));
        await fillField('[data-tour="field-volume"]', "20000");
        await new Promise((r) => setTimeout(r, 80));
        await fillField('[data-tour="field-city"]', "São Paulo");
        await new Promise((r) => setTimeout(r, 80));
        await fillField('[data-tour="field-uf"]', "SP");
        await new Promise((r) => setTimeout(r, 80));
        await fillField('[data-tour="field-deadline"]', "7");
        await new Promise((r) => setTimeout(r, 80));
        await fillField('[data-tour="field-target"]', "140000");
      }

      // step de seleção: marcar 2 fornecedores + 2 transportadoras
      if (step.id === "select") {
        await new Promise((r) => setTimeout(r, 600));
        const checkboxes = Array.from(
          document.querySelectorAll<HTMLInputElement>(
            '[data-tour^="select-"] input[type="checkbox"]',
          ),
        );
        // marcar primeiros 2 + 2 — assumindo ordem suppliers->carriers no DOM
        for (let k = 0; k < Math.min(checkboxes.length, 4); k++) {
          checkboxes[k].click();
          await new Promise((r) => setTimeout(r, 220));
        }
      }

      // step de leilão: dar um lance interativo no meio
      if (step.id === "auction-live") {
        await new Promise((r) => setTimeout(r, 3500));
        const productInput = document.querySelector(
          '[data-tour="bid-input-PRODUCT"]',
        ) as HTMLInputElement | null;
        if (productInput) {
          const cur = Number(productInput.value || 0);
          const myBid = Math.max(0, Math.round((cur * 0.985) * 100) / 100);
          setNativeValue(productInput, String(myBid));
          await new Promise((r) => setTimeout(r, 200));
          (
            document.querySelector('[data-tour="bid-cta-PRODUCT"]') as HTMLElement | null
          )?.click();
        }
      }

      // executar clique
      if (step.click) {
        const sel = typeof step.click === "function" ? step.click(ctx) : step.click;
        await dispatchClick(sel);
        await new Promise((r) => setTimeout(r, 250));
      }

      // capturar IDs após ação
      if (step.capture === "demandId") {
        const dId = await captureLatestDemandId();
        if (dId) ctx = { ...ctx, demandId: dId };
        // navega manualmente para auction-room quando fluxo de leilão começar
      }
      if (step.capture === "contractId") {
        const cId = await captureLatestContractId();
        if (cId) ctx = { ...ctx, contractId: cId };
      }

      // navegação implícita pós-publicação: ir pra detalhe da demanda
      if (step.id === "publish") {
        if (ctx.demandId) {
          navigate(`/buyer/demand/${ctx.demandId}`);
          await new Promise((r) => setTimeout(r, 400));
        }
      }
      if (step.id === "start-auction") {
        if (ctx.demandId) {
          navigate(`/auction/${ctx.demandId}`);
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      const reason = await wait(step.duration);
      if (reason === "cancel") return;
    }

    setState(initial);
  }, [
    navigate,
    wait,
    dispatchClick,
    fillField,
    captureLatestDemandId,
    captureLatestContractId,
  ]);

  const value = useMemo<TourAPI>(
    () => ({ state, steps: tourSteps, start, stop, togglePause, next }),
    [state, start, stop, togglePause, next],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourAPI {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}
