import { useState, useRef } from "react";
import { C } from "../ui/theme";
import { uid, today, fmt } from "../lib/format";
import { P_CLASSES, K_CLASSES, ADUBA_PRODUCAO, PARCELAMENTO, FOLIAR, classFor, calcCalagem } from "../data/fertilizer";
import { valvulaOptions } from "../lib/registros";
import { Card, Btn, Icon, Input, Select, StatCard } from "../ui";

// ─── RECOMENDACAO DE ADUBACAO (a partir da analise de solo) ──────────────────
export default function FertilizerAdvisor({ data, setData }) {
  const [form, setForm] = useState({
    talhao: "", cultivar: "Paluma", prodClasse: 0,
    P: "", K: "", V: "", CTC: "", PRNT: "", prof: "20",
    area: "", plantas: "", anexoNome: "",
  });
  const [rec, setRec] = useState(null);
  const fileRef = useRef();

  const prodOptions = ADUBA_PRODUCAO[form.cultivar].map((r, i) => ({ value: i, label: r.classe }));

  const onFile = (e) => {
    const f = e.target.files[0];
    if (f) setForm(s => ({ ...s, anexoNome: f.name }));
  };

  const gerar = () => {
    const linha = ADUBA_PRODUCAO[form.cultivar][Number(form.prodClasse)];
    const pClass = form.P !== "" ? classFor(P_CLASSES, Number(form.P)) : null;
    const kClass = form.K !== "" ? classFor(K_CLASSES, Number(form.K)) : null;
    const N = linha.N;
    const P2O5 = pClass ? linha.P2O5[pClass.key] : null;
    const K2O = kClass ? linha.K2O[kClass.key] : null;
    const calagem = calcCalagem(form.V, form.CTC, form.PRNT, Number(form.prof));
    const plantas = Number(form.plantas) || null;
    setRec({
      geradoEm: today(), ...form, linha, pClass, kClass, N, P2O5, K2O, calagem, plantas,
      totalHa: plantas ? { N: (N * plantas) / 1000, P2O5: P2O5 != null ? (P2O5 * plantas) / 1000 : null, K2O: K2O != null ? (K2O * plantas) / 1000 : null } : null,
    });
  };

  const salvarComoManejo = () => {
    if (!rec) return;
    const ev = {
      id: uid(), date: today(), type: "adubacao", talhao: rec.talhao,
      title: `Recomendacao de adubacao - ${rec.cultivar} (${rec.linha.classe})`,
      product: `N ${rec.N} g/pl - P2O5 ${rec.P2O5 ?? "-"} g/pl - K2O ${rec.K2O ?? "-"} g/pl`,
      dose: rec.totalHa ? `~${fmt(rec.totalHa.N, 0)}/${rec.totalHa.P2O5 != null ? fmt(rec.totalHa.P2O5, 0) : "-"}/${rec.totalHa.K2O != null ? fmt(rec.totalHa.K2O, 0) : "-"} kg/ha (N/P2O5/K2O)` : "",
      area: rec.area, nextDate: "",
      notes: `Analise: P=${rec.P || "-"} mg/dm3 (${rec.pClass?.label || "-"}), K=${rec.K || "-"} mmolc/dm3 (${rec.kClass?.label || "-"}). ${rec.calagem != null ? `Calagem: ${fmt(rec.calagem)} t/ha.` : ""} ${rec.anexoNome ? `Laudo: ${rec.anexoNome}` : ""}`.trim(),
    };
    setData(d => ({ ...d, agronomicEvents: [ev, ...d.agronomicEvents] }));
    alert("Recomendacao salva no Manejo Agronomico!");
  };

  const Etapa = ({ p }) => {
    const val = (pct, dose) => dose == null ? "-" : `${fmt((dose * pct) / 100, 0)} g/pl`;
    return (
      <tr>
        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>{p.etapa}</td>
        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, fontSize: 13, textAlign: "center" }}>{p.N}% - {val(p.N, rec.N)}</td>
        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, fontSize: 13, textAlign: "center" }}>{p.P2O5}% - {val(p.P2O5, rec.P2O5)}</td>
        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, fontSize: 13, textAlign: "center" }}>{p.K2O}% - {val(p.K2O, rec.K2O)}</td>
      </tr>
    );
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 8px", color: C.text }}>Recomendacao de Adubacao</h2>
      <div style={{ background: C.green50, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: C.textSoft }}>
        Baseado nas tabelas de <strong>Natale et al. (FCAV/Unesp) e Embrapa</strong> para goiabeira em producao (a partir do 3o ano), por cultivar, classe de produtividade e analise de solo. Preencha os dados do laudo e, se quiser, anexe o PDF/imagem da analise. Confira sempre com analise foliar no florescimento.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <h4 style={{ margin: "0 0 12px", fontSize: 15, color: C.text }}>Dados da lavoura</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Select label="Válvula" value={form.talhao} onChange={v => setForm(s => ({ ...s, talhao: v }))} options={valvulaOptions(data.agronomicEvents.map(e => e.talhao))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Select label="Cultivar" value={form.cultivar} onChange={v => setForm(s => ({ ...s, cultivar: v, prodClasse: 0 }))} options={[{ value: "Paluma", label: "Paluma" }, { value: "Rica", label: "Rica" }]} />
              <Select label="Produtividade esperada" value={form.prodClasse} onChange={v => setForm(s => ({ ...s, prodClasse: v }))} options={prodOptions} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input label="Area (ha)" type="number" value={form.area} onChange={v => setForm(s => ({ ...s, area: v }))} />
              <Input label="No de plantas" type="number" value={form.plantas} onChange={v => setForm(s => ({ ...s, plantas: v }))} />
            </div>
          </div>
        </Card>

        <Card>
          <h4 style={{ margin: "0 0 12px", fontSize: 15, color: C.text }}>Resultado da analise de solo</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input label="P resina (mg/dm3)" type="number" value={form.P} onChange={v => setForm(s => ({ ...s, P: v }))} />
              <Input label="K troc. (mmolc/dm3)" type="number" value={form.K} onChange={v => setForm(s => ({ ...s, K: v }))} />
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: -4 }}>
              Se o K vier em cmolc/dm3 ou meq/100cm3, multiplique por 10 para obter mmolc/dm3. Se vier em mg/dm3, divida por 39.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Input label="V atual (%)" type="number" value={form.V} onChange={v => setForm(s => ({ ...s, V: v }))} />
              <Input label="CTC (mmolc/dm3)" type="number" value={form.CTC} onChange={v => setForm(s => ({ ...s, CTC: v }))} />
              <Input label="PRNT (%)" type="number" value={form.PRNT} onChange={v => setForm(s => ({ ...s, PRNT: v }))} />
            </div>
            <Select label="Profundidade de incorporacao" value={form.prof} onChange={v => setForm(s => ({ ...s, prof: v }))} options={[{ value: "20", label: "0-20 cm" }, { value: "30", label: "0-30 cm" }]} />
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFile} style={{ display: "none" }} />
            <Btn variant="ghost" onClick={() => fileRef.current.click()}><Icon name="camera" size={16} color={C.primary} /> Anexar laudo (PDF/foto)</Btn>
            {form.anexoNome && <span style={{ fontSize: 13, color: C.primary }}>[anexo] {form.anexoNome}</span>}
          </div>
          <Btn onClick={gerar}><Icon name="fertilizer" size={16} color="#fff" /> Gerar recomendacao</Btn>
        </div>
      </Card>

      {rec && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
            <StatCard label="Nitrogenio (N)" value={`${rec.N} g/pl`} icon="fertilizer" color={C.primary} sub={rec.totalHa ? `${fmt(rec.totalHa.N, 0)} kg N/ha` : ""} />
            <StatCard label="Fosforo (P2O5)" value={rec.P2O5 != null ? `${rec.P2O5} g/pl` : "informe P"} icon="fertilizer" color={C.blue} sub={rec.pClass ? rec.pClass.label : ""} />
            <StatCard label="Potassio (K2O)" value={rec.K2O != null ? `${rec.K2O} g/pl` : "informe K"} icon="fertilizer" color={C.accentDark} sub={rec.kClass ? rec.kClass.label : ""} />
          </div>

          {rec.calagem != null && (
            <Card style={{ marginBottom: 16, borderLeft: `4px solid ${C.primaryLight}` }}>
              <strong style={{ color: C.text }}>Calagem: {fmt(rec.calagem)} t/ha</strong>
              <span style={{ color: C.muted, fontSize: 13 }}> - para elevar V a 70% (incorporacao {rec.prof === "30" ? "0-30 cm" : "0-20 cm"}). Formula: NC = (70 - V) x CTC / (10 x PRNT).</span>
            </Card>
          )}

          <Card style={{ marginBottom: 16 }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 15, color: C.text }}>Parcelamento em fertirrigacao (por planta)</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: `2px solid ${C.border}`, color: C.muted, fontSize: 12 }}>Etapa</th>
                  <th style={{ padding: "8px 10px", borderBottom: `2px solid ${C.border}`, color: C.muted, fontSize: 12 }}>N</th>
                  <th style={{ padding: "8px 10px", borderBottom: `2px solid ${C.border}`, color: C.muted, fontSize: 12 }}>P2O5</th>
                  <th style={{ padding: "8px 10px", borderBottom: `2px solid ${C.border}`, color: C.muted, fontSize: 12 }}>K2O</th>
                </tr></thead>
                <tbody>{PARCELAMENTO.map((p, i) => <Etapa key={i} p={p} />)}</tbody>
              </table>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Todo o P2O5 e aplicado no inicio (pode ser parcelado junto com N e K, se conveniente). Inicio ~1 mes antes da poda.</div>
          </Card>

          {rec.totalHa && (
            <Card style={{ marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 15, color: C.text }}>Total estimado para a válvula ({rec.plantas} plantas)</h4>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 14 }}>
                <div><span style={{ color: C.muted }}>N:</span> <strong>{fmt(rec.totalHa.N, 1)} kg</strong></div>
                {rec.totalHa.P2O5 != null && <div><span style={{ color: C.muted }}>P2O5:</span> <strong>{fmt(rec.totalHa.P2O5, 1)} kg</strong></div>}
                {rec.totalHa.K2O != null && <div><span style={{ color: C.muted }}>K2O:</span> <strong>{fmt(rec.totalHa.K2O, 1)} kg</strong></div>}
              </div>
            </Card>
          )}

          <Card style={{ marginBottom: 16 }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 15, color: C.text }}>Teores foliares adequados - {rec.cultivar} (3o par, florescimento)</h4>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13, color: C.textSoft }}>
              {Object.entries(FOLIAR[rec.cultivar]).map(([k, v]) => <div key={k}><strong>{k}:</strong> {v} g/kg</div>)}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
              Se N foliar maior que {rec.cultivar === "Paluma" ? "23" : "26"} g/kg, reduzir N (suprimir no ultimo parcelamento). Se K foliar maior que {rec.cultivar === "Paluma" ? "17" : "19"} g/kg, reduzir K. Aplicar B (acido borico 0,06%) e Zn (sulfato de zinco 0,5%) via foliar.
            </div>
          </Card>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="accent" onClick={salvarComoManejo}><Icon name="plus" size={16} color="#1A2E1A" /> Salvar no Manejo</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
