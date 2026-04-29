import { Pause, Play, SkipForward, X } from "lucide-react";
import { useTour } from "./TourController";

export function TourOverlay() {
  const tour = useTour();
  if (!tour.state.active) return null;
  const step = tour.steps[tour.state.currentIdx];
  if (!step) return null;
  const total = tour.steps.length;
  const pct = ((tour.state.currentIdx + 1) / total) * 100;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(480px,calc(100vw-2rem))] animate-pop-in">
      <div className="rounded-xl bg-steel-950 text-white shadow-2xl border border-steel-700/60 overflow-hidden">
        <div className="h-1 bg-steel-800">
          <div
            className="h-full bg-gradient-to-r from-molten-500 to-molten-300 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-molten-400 font-bold mb-1">
            <span className="bg-molten-600/20 px-2 py-0.5 rounded">
              {tour.state.currentIdx + 1} / {total}
            </span>
            <span>Tour de 60 segundos</span>
          </div>
          <h3 className="font-bold text-base">{step.title}</h3>
          <p className="text-sm text-steel-300 leading-relaxed mt-1.5">{step.body}</p>

          <div className="mt-3 pt-3 border-t border-steel-800 flex items-center justify-between gap-2">
            <button
              onClick={tour.togglePause}
              className="text-xs flex items-center gap-1.5 text-steel-300 hover:text-white"
            >
              {tour.state.paused ? (
                <>
                  <Play className="w-3.5 h-3.5" /> Continuar
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pausar
                </>
              )}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={tour.next}
                className="text-xs flex items-center gap-1 text-steel-300 hover:text-white px-2 py-1 rounded hover:bg-steel-800/60"
              >
                <SkipForward className="w-3.5 h-3.5" /> Pular
              </button>
              <button
                onClick={tour.stop}
                className="text-xs flex items-center gap-1 text-steel-300 hover:text-rose-400 px-2 py-1 rounded hover:bg-steel-800/60"
              >
                <X className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
