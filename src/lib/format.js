// ─── Helpers ─────────────────────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 9);
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (dateStr, days) => { const d = new Date(dateStr + "T00:00:00"); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
export const fmt = (n, dec = 2) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const fmtMoney = (n) => `R$ ${fmt(n)}`;
export const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "-";
export const monthKey = (d) => d ? d.slice(0, 7) : "";
