import { useState } from "react";
import { C } from "./ui/theme";
import { envOk, saveCfg, testConnection } from "./lib/supabase";

// Tela de login: só usuário + senha. URL e anon key vêm do .env.
export default function Login({ onDone }) {
  const [user, setUser] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState(null); // null | testing | erro
  const [msg, setMsg] = useState("");

  const entrar = async () => {
    if (!user || !pin) { setStatus("erro"); setMsg("Preencha todos os campos."); return; }
    setStatus("testing"); setMsg("Conectando ao Supabase…");
    const res = await testConnection();
    if (res.ok) { saveCfg(user.trim().toLowerCase() + "::" + pin.trim()); onDone(); }
    else { setStatus("erro"); setMsg(res.msg); }
  };

  const box = { padding: "11px 13px", borderRadius: 9, border: "1.5px solid " + C.border, fontSize: 15, fontFamily: "inherit", background: C.bg, outline: "none", width: "100%" };
  const lbl = { fontSize: 12, fontWeight: 600, color: C.textSoft, marginBottom: 4, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #2D6A2D 0%, #1A4A1A 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 30, width: "100%", maxWidth: 440, boxShadow: "0 12px 48px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ background: C.accent, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🍃</div>
          <div><div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>Fazenda Goiaba</div><div style={{ fontSize: 12, color: C.muted }}>Gestão com sincronização na nuvem</div></div>
        </div>
        <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.5, margin: "14px 0 18px" }}>
          Entre com seu usuário e senha para os dados sincronizarem entre o celular e o PC. Você só precisa fazer isso uma vez em cada aparelho.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!envOk && (
            <div style={{ background: C.dangerLight, color: "#7a2018", borderRadius: 9, padding: "10px 12px", fontSize: 13 }}>
              ⚠ Credenciais do Supabase não configuradas. Preencha <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> no arquivo <strong>.env</strong> do projeto e reinicie o app.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Seu usuário</label><input style={box} value={user} onChange={e => setUser(e.target.value)} placeholder="ex: alexandre" /></div>
            <div><label style={lbl}>Senha (PIN)</label><input style={box} type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="sua senha" /></div>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: -4 }}>
            Use o <strong>mesmo usuário e a mesma senha</strong> no celular e no PC para acessar os mesmos dados.
          </div>

          {status === "erro" && <div style={{ background: C.dangerLight, color: "#7a2018", borderRadius: 9, padding: "10px 12px", fontSize: 13 }}>⚠ {msg}</div>}
          {status === "testing" && <div style={{ background: C.green50, color: C.primary, borderRadius: 9, padding: "10px 12px", fontSize: 13 }}>{msg}</div>}

          <button onClick={entrar} disabled={status === "testing"} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: status === "testing" ? .7 : 1 }}>
            Entrar e sincronizar
          </button>
        </div>
      </div>
    </div>
  );
}
