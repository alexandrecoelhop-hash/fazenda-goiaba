import { useId } from "react";
import { C } from "./theme";
import { useIsMobile } from "../lib/useIsMobile";

// ─── Icons ───────────────────────────────────────────────────────────────────
export const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const paths = {
    dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    stock: "M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9 8H9v2H7v-2H5v-2h2v-2h2v2h2v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 14 15.5 14s1.5.67 1.5 1.5S16.33 17 15.5 17z",
    buy: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 23.43 4H5.21l-.94-2H1z",
    labor: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    energy: "M7 2v11h3v9l7-12h-4l4-8z",
    fruit: "M17 8C8 10 5.9 16.17 3.82 19.99L5.71 21l1-2.3A4.49 4.49 0 0 0 8 19c8 0 10-8 10-8s0-1.5-1-3zm-2.04 8.51c-1.23.44-2.59.75-4.03.75C5.32 17.26 4 14.23 4 11c0-2.73 1.04-5.23 2.75-7.1 2.26 2.33 5.23 3.84 8.76 4.12L17 8s0 6.72-2.04 8.51z",
    pruning: "M17 8C8 10 5.9 16.17 3.82 19.99L5.71 21l1-2.3A4.49 4.49 0 0 0 8 19c8 0 10-8 10-8s0-1.5-1-3zm-4 9c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z",
    fertilizer: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z",
    phyto: "M12 2L4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z",
    finance: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
    plot: "M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z",
    plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
    close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59z",
    check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
    excel: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3.5 14h-2l-1.5-2.5L10.5 17h-2l2.5-4L8.5 9h2l1.5 2.5L13.5 9h2L13 13l2.5 4z",
    search: "M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z",
    camera: "M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4zM9 2L7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
    calendar: "M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V9h14v10zM7 11h5v5H7z",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d={paths[name] || paths.dashboard} /></svg>;
};

// ─── Shared UI ───────────────────────────────────────────────────────────────
export const Badge = ({ color, children }) => (
  <span style={{ background: color + "22", color, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>
);
export const Btn = ({ onClick, variant = "primary", size = "md", children, style = {} }) => {
  const base = { display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" };
  const pad = size === "sm" ? "6px 14px" : "10px 20px", fs = size === "sm" ? 13 : 14;
  const v = {
    primary: { background: C.primary, color: "#fff", padding: pad, fontSize: fs },
    accent: { background: C.accent, color: "#1A2E1A", padding: pad, fontSize: fs },
    danger: { background: C.danger, color: "#fff", padding: pad, fontSize: fs },
    ghost: { background: "transparent", color: C.primary, padding: pad, fontSize: fs, border: `1.5px solid ${C.border}` },
  };
  return <button style={{ ...base, ...v[variant], ...style }} onClick={onClick}>{children}</button>;
};
export const Input = ({ label, type = "text", value, onChange, placeholder, required, suggestions, style = {} }) => {
  const listId = useId();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft }}>{label}{required && " *"}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} list={suggestions && suggestions.length ? listId : undefined}
        style={{ padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", color: C.text, background: C.bg, outline: "none", width: "100%", minWidth: 0, boxSizing: "border-box" }} />
      {suggestions && suggestions.length > 0 && <datalist id={listId}>{suggestions.map(s => <option key={s} value={s} />)}</datalist>}
    </div>
  );
};
export const Select = ({ label, value, onChange, options, style = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", color: C.text, background: C.bg, outline: "none", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);
export const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, ...style }}>{children}</div>
);
export const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: C.card, borderRadius: 16, padding: 28, width: "100%", maxWidth: wide ? 720 : 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 48px rgba(0,0,0,.18)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: C.text, fontSize: 18 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}><Icon name="close" size={22} color={C.muted} /></button>
      </div>
      {children}
    </div>
  </div>
);
export const StatCard = ({ label, value, color = C.primary, icon, sub }) => (
  <Card style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
    <div style={{ background: color + "18", borderRadius: 10, padding: 10 }}><Icon name={icon} size={24} color={color} /></div>
    <div>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  </Card>
);
export const Table = ({ cols, rows, empty = "Nenhum registro." }) => {
  const isMobile = useIsMobile();
  if (rows.length === 0) return <p style={{ textAlign: "center", color: C.muted, padding: 24, margin: 0, fontSize: 13 }}>{empty}</p>;

  // No celular cada registro vira um cartão (tabela larga fica ilegível)
  if (isMobile) {
    const campos = cols.filter(c => c.label);
    const acoes = cols.filter(c => !c.label);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((row, i) => (
          <div key={row.id || i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 13 }}>
            {campos.map(c => {
              const v = c.render ? c.render(row) : row[c.key];
              if (v == null || v === "" || v === "-") return null;
              return (
                <div key={c.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0" }}>
                  <span style={{ color: C.muted, flexShrink: 0 }}>{c.label}</span>
                  <span style={{ textAlign: "right", minWidth: 0 }}>{v}</span>
                </div>
              );
            })}
            {acoes.length > 0 && <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>{acoes.map(c => <span key={c.key}>{c.render ? c.render(row) : null}</span>)}</div>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>{cols.map(c => <th key={c.key} style={{ textAlign: "left", padding: "8px 12px", borderBottom: `2px solid ${C.border}`, color: C.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} style={{ background: i % 2 === 0 ? C.bg : C.card }}>
              {cols.map(c => <td key={c.key} style={{ padding: "9px 12px", borderBottom: `1px solid ${C.border}` }}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
