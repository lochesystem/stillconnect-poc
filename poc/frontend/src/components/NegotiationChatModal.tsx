import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useDB } from "./useDB";
import {
  canSendNegotiationMessage,
  listNegotiationMessages,
  sendNegotiationMessage,
} from "../mock/services";
import { dt } from "../lib/format";

interface NegotiationChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  /** Quem abriu o modal — no mock coexistem current_buyer_id e current_supplier_id; sem isto o remetente ficaria errado. */
  actingAs: "buyer" | "supplier";
}

export default function NegotiationChatModal({
  open,
  onOpenChange,
  offerId,
  actingAs,
}: NegotiationChatModalProps) {
  const db = useDB();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const offer = db.offers.find((o) => o.id === offerId);
  const demand = offer ? db.demands.find((d) => d.id === offer.demand_id) : undefined;
  const supplierOrg = offer ? db.orgs.find((o) => o.id === offer.supplier_org_id) : undefined;

  const messages = offerId ? listNegotiationMessages(offerId) : [];
  const allowSend = offerId ? canSendNegotiationMessage(offerId) : false;

  useEffect(() => {
    if (!open) setDraft("");
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open || !offer || !demand) return null;

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    try {
      sendNegotiationMessage(offerId, draft, actingAs);
      setDraft("");
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-steel-950/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="negotiation-chat-title"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-steel-200/80 flex flex-col max-h-[85vh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-steel-200/70 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-steel-900 font-semibold">
              <MessageCircle className="w-4 h-4 text-molten-600 shrink-0" />
              <span id="negotiation-chat-title">Negociação (RFQ)</span>
            </div>
            <p className="text-xs text-steel-500 mt-0.5 truncate">
              {supplierOrg?.fantasia ?? "Fornecedor"} · {demand.product}
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost p-1.5 shrink-0"
            aria-label="Fechar"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <p className="text-[11px] text-steel-500 px-4 pt-2 shrink-0 leading-snug">
          Demo local: troque entre <strong>Comprador</strong> e <strong>Fornecedor</strong> no menu para ver as duas pontas. Sem servidor — mensagens ficam neste browser.
        </p>

        <div
          ref={listRef}
          className="flex-1 min-h-[200px] max-h-[45vh] overflow-y-auto px-4 py-3 space-y-2 bg-steel-50/80"
        >
          {messages.length === 0 ? (
            <div className="text-sm text-steel-500 text-center py-8">
              Nenhuma mensagem ainda. Use o campo abaixo para alinhar detalhes antes de aceitar ou recusar.
            </div>
          ) : (
            messages.map((m) => {
              const fromBuyer = m.sender_org_id === demand.buyer_id;
              return (
                <div key={m.id} className={`flex ${fromBuyer ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      fromBuyer
                        ? "bg-molten-600 text-white rounded-br-sm"
                        : "bg-white border border-steel-200 text-steel-900 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    <div className="text-[10px] opacity-80 mb-0.5 font-medium">
                      {fromBuyer
                        ? "Comprador"
                        : supplierOrg?.fantasia ?? "Fornecedor"}{" "}
                      · {dt(m.created_at)}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-steel-200/70 shrink-0 space-y-2">
          {!allowSend ? (
            <p className="text-xs text-steel-500">
              Envio desativado: oferta não está mais pendente, contrato já criado ou coleta encerrada.
            </p>
          ) : null}
          <div className="flex gap-2">
            <textarea
              className="input flex-1 min-h-[44px] max-h-28 resize-y text-sm"
              placeholder={allowSend ? "Mensagem breve…" : "Somente leitura"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!allowSend}
              maxLength={800}
              rows={2}
            />
            <button
              type="submit"
              className="btn-primary self-end shrink-0"
              disabled={!allowSend || !draft.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
