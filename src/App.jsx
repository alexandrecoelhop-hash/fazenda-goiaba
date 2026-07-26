import { useState, useEffect, useRef } from "react";
import { C } from "./ui/theme";
import { Btn, Icon } from "./ui";
import { getCfg, logout, loadData, saveData } from "./lib/supabase";
import { useIsMobile, isMobileNow } from "./lib/useIsMobile";
import { exportToExcel } from "./lib/excel";
import Login from "./Login";
import Dashboard from "./sections/Dashboard";
import Plots from "./sections/Plots";
import Agronomic from "./sections/Agronomic";
import FertilizerAdvisor from "./sections/FertilizerAdvisor";
import Schedule from "./sections/Schedule";
import Applications from "./sections/Applications";
import PestAdvisor from "./sections/PestAdvisor";
import Stock from "./sections/Stock";
import ImportarNota from "./sections/ImportarNota";
import TradeSection from "./sections/TradeSection";
import Labor from "./sections/Labor";
import Energy from "./sections/Energy";
import FruitSales from "./sections/FruitSales";
import Finance from "./sections/Finance";

// ─── NAV ─────────────────────────────────────────────────────────────────────
const navItems = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "plots", label: "Válvulas", icon: "plot" },
  { key: "agronomic", label: "Manejo", icon: "pruning" },
  { key: "fertilizer", label: "Adubação", icon: "fertilizer" },
  { key: "schedule", label: "Cronograma", icon: "calendar" },
  { key: "applications", label: "Aplicações", icon: "phyto" },
  { key: "advisor", label: "Diagnóstico", icon: "search" },
  { key: "stock", label: "Estoque", icon: "stock" },
  { key: "nota", label: "Importar Nota", icon: "excel" },
  { key: "inputs", label: "Insumos", icon: "fertilizer" },
  { key: "materials", label: "Materiais", icon: "buy" },
  { key: "labor", label: "Mão de Obra", icon: "labor" },
  { key: "energy", label: "Energia", icon: "energy" },
  { key: "fruits", label: "Venda Frutas", icon: "fruit" },
  { key: "finance", label: "Financeiro", icon: "finance" },
];

// ─── GATE (mostra login enquanto não há usuário salvo) ───────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    const c = getCfg();
    if (c && c.user) setReady(true);
    else setNeedLogin(true);
  }, []);

  if (needLogin && !ready) return <Login onDone={() => { setNeedLogin(false); setReady(true); }} />;
  if (!ready) return null;
  return <FarmApp />;
}

// ─── APP ─────────────────────────────────────────────────────────────────────
function FarmApp() {
  const [page, setPage] = useState("dashboard");
  const isMobile = useIsMobile();
  const [sideOpen, setSideOpen] = useState(() => !isMobileNow());
  const EMPTY = {
    stockItems: [], inputPurchases: [], materialTransactions: [], laborEntries: [],
    energyBills: [], fruitSales: [], agronomicEvents: [], plots: [], applications: [],
  };
  const [data, setData] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const skipNextSave = useRef(true);
  const versaoLocal = useRef(0);      // conta as alterações feitas neste aparelho
  const naoSalvo = useRef(false);     // há alteração local ainda não gravada na nuvem

  // Toda alteração do usuário passa por aqui, para a sincronização não sobrescrevê-la
  const setDataUsuario = (updater) => {
    versaoLocal.current += 1;
    naoSalvo.current = true;
    setData(updater);
  };

  // Carrega os dados da nuvem (Supabase) ao abrir + sincroniza periodicamente
  const puxarNuvem = async (silencioso) => {
    const versaoAntes = versaoLocal.current;
    try {
      const remoto = await loadData();
      // descarta o que veio da nuvem se algo foi alterado aqui nesse meio tempo
      const houveAlteracaoLocal = versaoLocal.current !== versaoAntes || naoSalvo.current;
      if (remoto && !houveAlteracaoLocal) { skipNextSave.current = true; setData({ ...EMPTY, ...remoto }); }
      if (!silencioso) setSaveState("saved");
    } catch (e) { if (!silencioso) setSaveState("error"); }
    setLoaded(true);
  };
  useEffect(() => { puxarNuvem(false); }, []);

  // Re-sincroniza quando o app volta ao foco (troca de aparelho, volta de outra aba)
  useEffect(() => {
    const onFocus = () => { if (loaded) puxarNuvem(true); };
    const onVisibility = () => { if (!document.hidden) onFocus(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loaded]);

  // Salva na nuvem a cada alteração (após o carregamento inicial)
  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        await saveData(data);
        naoSalvo.current = false;
        setSaveState("saved");
        setTimeout(() => setSaveState(s => s === "saved" ? "idle" : s), 1500);
      } catch (e) { setSaveState("error"); }
    }, 800);
    return () => clearTimeout(t);
  }, [data, loaded]);

  const sideW = isMobile ? 240 : (sideOpen ? 210 : 58);
  const goTo = (key) => { setPage(key); if (isMobile) setSideOpen(false); };
  const sideStyle = isMobile
    ? { width: sideW, background: C.primary, display: "flex", flexDirection: "column", overflow: "hidden", position: "fixed", top: 0, bottom: 0, left: sideOpen ? 0 : -sideW, zIndex: 900, transition: "left .2s", boxShadow: sideOpen ? "0 0 32px rgba(0,0,0,.35)" : "none" }
    : { width: sideW, minHeight: "100vh", background: C.primary, display: "flex", flexDirection: "column", transition: "width .2s", overflow: "hidden", flexShrink: 0 };
  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: C.bg, minHeight: "100vh", display: "flex", color: C.text }}>
      {isMobile && sideOpen && <div onClick={() => setSideOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 899 }} />}
      <div style={sideStyle}>
        <div style={{ padding: "18px 14px 14px", borderBottom: "1px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: C.accent, borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 17 }}>🍃</div>
          {(sideOpen || isMobile) && <div style={{ color: "#fff", fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>Fazenda<br /><span style={{ color: C.accent, fontSize: 11 }}>GOIABA</span></div>}
        </div>
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => goTo(item.key)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: "none", background: page === item.key ? "rgba(255,255,255,.18)" : "transparent", color: page === item.key ? "#fff" : "rgba(255,255,255,.7)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: page === item.key ? 700 : 500, marginBottom: 2, textAlign: "left", whiteSpace: "nowrap" }}>
              <span style={{ flexShrink: 0 }}><Icon name={item.icon} size={18} color={page === item.key ? "#fff" : "rgba(255,255,255,.7)"} /></span>
              {(sideOpen || isMobile) && item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setSideOpen(o => !o)} style={{ margin: "0 8px 14px", padding: 8, border: "none", background: "rgba(255,255,255,.1)", borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>{isMobile ? "✕ Fechar menu" : (sideOpen ? "◀" : "▶")}</button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: isMobile ? "10px 12px" : "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {isMobile && <button onClick={() => setSideOpen(true)} aria-label="Abrir menu" style={{ background: C.green50, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 11px", fontSize: 18, lineHeight: 1, color: C.primary, cursor: "pointer" }}>☰</button>}
            <h1 style={{ margin: 0, fontSize: isMobile ? 16 : 18, color: C.text, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{navItems.find(n => n.key === page)?.label}</h1>
          </div>
          <div style={{ display: "flex", gap: isMobile ? 8 : 12, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: saveState === "error" ? C.danger : saveState === "saved" ? C.primary : C.muted, fontWeight: saveState === "idle" ? 400 : 600, minWidth: isMobile ? 0 : 110, textAlign: "right" }}>
              {isMobile
                ? (saveState === "saving" ? "☁…" : saveState === "saved" ? "☁ ✓" : saveState === "error" ? "⚠" : "☁")
                : (saveState === "saving" ? "☁ Salvando…" : saveState === "saved" ? "☁ ✓ Sincronizado" : saveState === "error" ? "⚠ Erro ao salvar" : "☁ na nuvem")}
            </span>
            <button onClick={() => { if (window.confirm("Sair da conta neste aparelho? Os dados continuam salvos na nuvem.")) { logout(); location.reload(); } }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 12, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
            <Btn variant="accent" size="sm" onClick={() => exportToExcel(data)}><Icon name="excel" size={16} color="#1A2E1A" />{!isMobile && " Exportar Excel"}</Btn>
          </div>
        </div>
        <div style={{ flex: 1, padding: isMobile ? 12 : 24, overflowY: "auto" }}>
          {page === "dashboard" && <Dashboard data={data} />}
          {page === "plots" && <Plots data={data} setData={setDataUsuario} />}
          {page === "agronomic" && <Agronomic data={data} setData={setDataUsuario} />}
          {page === "fertilizer" && <FertilizerAdvisor data={data} setData={setDataUsuario} />}
          {page === "schedule" && <Schedule data={data} setData={setDataUsuario} />}
          {page === "applications" && <Applications data={data} setData={setDataUsuario} />}
          {page === "advisor" && <PestAdvisor />}
          {page === "stock" && <Stock data={data} setData={setDataUsuario} />}
          {page === "nota" && <ImportarNota data={data} setData={setDataUsuario} />}
          {page === "inputs" && <TradeSection title="Insumos" listKey="inputPurchases" itemLabel="Produto" data={data} setData={setDataUsuario} updateStock />}
          {page === "materials" && <TradeSection title="Materiais" listKey="materialTransactions" itemLabel="Material" data={data} setData={setDataUsuario} />}
          {page === "labor" && <Labor data={data} setData={setDataUsuario} />}
          {page === "energy" && <Energy data={data} setData={setDataUsuario} />}
          {page === "fruits" && <FruitSales data={data} setData={setDataUsuario} />}
          {page === "finance" && <Finance data={data} />}
        </div>
      </div>
    </div>
  );
}
