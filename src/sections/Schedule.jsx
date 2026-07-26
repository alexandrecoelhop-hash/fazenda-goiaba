import { useState } from "react";
import { C } from "../ui/theme";
import { uid, today, addDays, fmtDate } from "../lib/format";
import { SCHEDULE_TEMPLATE } from "../data/schedule";
import { valvulaOptions } from "../lib/registros";
import { Card, Btn, Badge, Icon, Input, Select } from "../ui";

// ─── CRONOGRAMA ──────────────────────────────────────────────────────────────
export default function Schedule({ data, setData }) {
  const [startDate, setStartDate] = useState(today());
  const [talhao, setTalhao] = useState("");
  const [generated, setGenerated] = useState([]);
  const valvulas = valvulaOptions(data.agronomicEvents.map(e => e.talhao), data.applications.map(a => a.talhao));
  const generate = () => setGenerated(SCHEDULE_TEMPLATE.map(t => ({ ...t, id: uid(), date: addDays(startDate, t.offset), talhao })));
  const addToManejo = () => {
    const events = generated.map(g => ({ id: uid(), date: g.date, type: g.tipo, talhao: g.talhao, title: g.titulo, product: "", dose: "", area: "", notes: g.detalhe, nextDate: "" }));
    setData(d => ({ ...d, agronomicEvents: [...events, ...d.agronomicEvents] }));
    alert(`${events.length} eventos adicionados ao Manejo Agronômico!`);
  };
  return (
    <div>
      <h2 style={{ margin: "0 0 8px", color: C.text }}>Cronograma de Manejo</h2>
      <p style={{ color: C.muted, fontSize: 13, marginTop: 0, marginBottom: 20 }}>
        Gera o calendário completo do ciclo a partir da data da <strong>poda de produção</strong> (ou pós-colheita). Referência para goiaba irrigada — ajuste conforme sua região e cultivar.
      </p>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 12, alignItems: "end" }}>
          <Input label="Data da poda / pós-colheita" type="date" value={startDate} onChange={setStartDate} />
          <Select label="Válvula" value={talhao} onChange={setTalhao} options={valvulas} />
          <Btn onClick={generate}><Icon name="calendar" size={16} color="#fff" /> Gerar cronograma</Btn>
          {generated.length > 0 && <Btn variant="accent" onClick={addToManejo}><Icon name="plus" size={16} color="#1A2E1A" /> Enviar ao Manejo</Btn>}
        </div>
      </Card>
      {generated.length > 0 && (
        <div style={{ position: "relative", paddingLeft: 28 }}>
          <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: 2, background: C.border }} />
          {generated.map((g) => (
            <div key={g.id} style={{ position: "relative", marginBottom: 14 }}>
              <div style={{ position: "absolute", left: -28, top: 6, width: 14, height: 14, borderRadius: "50%", background: g.cor, border: "3px solid #fff", boxShadow: `0 0 0 1px ${g.cor}` }} />
              <Card style={{ padding: 16, borderLeft: `4px solid ${g.cor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{g.titulo}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge color={g.cor}>{g.tipo}</Badge>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{fmtDate(g.date)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: C.textSoft }}>{g.detalhe}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{g.offset === 0 ? "Dia da poda" : `${g.offset} dias após a poda`}</div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
