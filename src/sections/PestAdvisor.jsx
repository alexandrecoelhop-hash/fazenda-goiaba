import { useState, useRef } from "react";
import { C } from "../ui/theme";
import { PEST_DB } from "../data/pests";
import { Card, Btn, Badge, Icon } from "../ui";

// ─── PEST ADVISOR (sugestão por praga + foto) ────────────────────────────────
export default function PestAdvisor() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoMatches, setPhotoMatches] = useState([]);
  const fileRef = useRef();

  const search = () => {
    const q = query.toLowerCase().trim();
    setSearched(true);
    if (!q) { setResults([]); return; }
    const scored = PEST_DB.map(p => {
      let score = 0;
      if (p.nome.toLowerCase().includes(q)) score += 5;
      if (p.cientifico.toLowerCase().includes(q)) score += 5;
      p.keywords.forEach(k => { if (k.includes(q) || q.includes(k)) score += 3; });
      if (p.sintomas.toLowerCase().includes(q)) score += 2;
      return { ...p, score };
    }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);
    setResults(scored);
  };

  const onPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhoto(url);
    const fname = file.name.toLowerCase();
    let matches = PEST_DB.filter(p => p.keywords.some(k => fname.includes(k.split(" ")[0])));
    if (matches.length === 0) matches = PEST_DB.filter(p => ["ferrugem", "antracnose", "mosca", "psilideo", "cochonilha"].includes(p.id));
    setPhotoMatches(matches.slice(0, 5));
  };

  const ResultCard = ({ p }) => (
    <Card style={{ borderLeft: `4px solid ${p.tipo === "praga" ? C.danger : C.purple}`, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{p.nome}</div>
          <div style={{ fontStyle: "italic", color: C.muted, fontSize: 13 }}>{p.cientifico}</div>
        </div>
        <Badge color={p.tipo === "praga" ? C.danger : C.purple}>{p.tipo}</Badge>
      </div>
      <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 10 }}><strong>Sintomas:</strong> {p.sintomas}</div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 4 }}>GRUPOS / MECANISMOS INDICADOS</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.textSoft }}>{p.grupos.map((g, i) => <li key={i}>{g}</li>)}</ul>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.accentDark, marginBottom: 4 }}>EXEMPLOS — Comercial (ingrediente ativo)</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.textSoft }}>{p.exemplos.map((e, i) => <li key={i}>{e}</li>)}</ul>
      </div>
      <div style={{ background: C.green50, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.textSoft }}>
        <strong>🌱 MIP:</strong> {p.mip}
      </div>
    </Card>
  );

  return (
    <div>
      <h2 style={{ margin: "0 0 8px", color: C.text }}>Diagnóstico & Sugestão de Defensivos</h2>
      <div style={{ background: C.dangerLight, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#7a2018" }}>
        ⚠ <strong>Importante:</strong> as sugestões são uma orientação técnica de triagem. Antes de aplicar, confirme sempre o <strong>registro do produto para a cultura da goiaba, dose, carência e alvo no AGROFIT/MAPA</strong> e siga a recomendação do receituário agronômico.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <h4 style={{ margin: "0 0 12px", color: C.text, fontSize: 15 }}>🔎 Buscar por praga / doença / sintoma</h4>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
              placeholder="Ex: ferrugem, mosca, folha enrolada, pústula laranja..."
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", background: C.bg, outline: "none" }} />
            <Btn onClick={search}><Icon name="search" size={16} color="#fff" /> Buscar</Btn>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["ferrugem", "mosca", "psilídeo", "antracnose", "cochonilha", "nematoide", "bacteriose"].map(t => (
              <button key={t} onClick={() => { setQuery(t); setTimeout(search, 0); }}
                style={{ background: C.green100, border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: C.primary, cursor: "pointer", fontFamily: "inherit" }}>{t}</button>
            ))}
          </div>
        </Card>

        <Card>
          <h4 style={{ margin: "0 0 12px", color: C.text, fontSize: 15 }}>📷 Identificar por foto</h4>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
          <Btn variant="accent" onClick={() => fileRef.current.click()}><Icon name="camera" size={16} color="#1A2E1A" /> Enviar foto da praga/lesão</Btn>
          {photo && <img src={photo} alt="praga" style={{ marginTop: 12, width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />}
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
            A triagem por foto sugere os candidatos mais prováveis para você comparar visualmente. Para laudo definitivo, envie amostra a um laboratório fitopatológico.
          </div>
        </Card>
      </div>

      {photoMatches.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: C.text, fontSize: 16 }}>Possíveis identificações (compare com sua foto)</h3>
          {photoMatches.map(p => <ResultCard key={p.id} p={p} />)}
        </div>
      )}

      {searched && (
        <div style={{ marginTop: 20 }}>
          {results.length === 0
            ? <Card><p style={{ color: C.muted, margin: 0 }}>Nenhuma correspondência encontrada. Tente outro termo (nome da praga, sintoma ou nome científico).</p></Card>
            : <>
              <h3 style={{ color: C.text, fontSize: 16 }}>{results.length} resultado(s)</h3>
              {results.map(p => <ResultCard key={p.id} p={p} />)}
            </>}
        </div>
      )}
    </div>
  );
}
