export function brl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

export function kg(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value) + " kg";
}

export function dt(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s atrás`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}min atrás`;
  const h = Math.round(m / 60);
  return `${h}h atrás`;
}

export function shortHash(h: string, len = 8): string {
  if (h.length <= len * 2) return h;
  return h.slice(0, len) + "…" + h.slice(-len);
}
