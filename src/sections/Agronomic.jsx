import { useState } from "react";
import { C } from "../ui/theme";
import { uid, today, fmtDate } from "../lib/format";
import { Card, Btn, Badge, Icon, Input, Select, Modal, Table } from "../ui";

// ─── Agronomic ───────────────────────────────────────────────────────────────
export default function Agronomic({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: today(), type: "poda", talhao: "", title: "", product: "", dose: "", area: "", notes: "", nextDate: "" });
  const types = [{ value: "poda", label: "Poda" }, { value: "adubacao", label: "Adubação de Cobertura" }, { value: "fertirrigacao", label: "Fertirrigação" }, { value: "irrigacao", label: "Irrigação" }, { value: "fitossanitario", label: "Fitossanitário" }, { value: "colheita", label: "Colheita" }, { value: "outro", label: "Outro" }];
  const colors = { poda: C.primary, adubacao: C.accentDark, fertirrigacao: C.blue, irrigacao: "#00BCD4", fitossanitario: C.danger, colheita: C.primaryLight, outro: C.muted };
  const save = () => { setData(d => ({ ...d, agronomicEvents: [{ ...form, id: uid() }, ...d.agronomicEvents] })); setModal(false); };
  const sorted = [...data.agronomicEvents].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0, color: C.text }}>Manejo Agronômico</h2><Btn onClick={() => { setForm({ date: today(), type: "poda", talhao: "", title: "", product: "", dose: "", area: "", notes: "", nextDate: "" }); setModal(true); }}><Icon name="plus" size={16} color="#fff" /> Novo Evento</Btn></div>
      <Card><Table cols={[
        { key: "date", label: "Data", render: r => fmtDate(r.date) }, { key: "type", label: "Tipo", render: r => <Badge color={colors[r.type]}>{types.find(t => t.value === r.type)?.label || r.type}</Badge> },
        { key: "talhao", label: "Talhão" }, { key: "title", label: "Descrição" }, { key: "product", label: "Produto" }, { key: "dose", label: "Dose/Lâmina" }, { key: "area", label: "ha" },
        { key: "nextDate", label: "Próxima", render: r => r.nextDate ? fmtDate(r.nextDate) : "-" }, { key: "notes", label: "Obs" },
        { key: "del", label: "", render: r => <Btn size="sm" variant="danger" onClick={() => setData(d => ({ ...d, agronomicEvents: d.agronomicEvents.filter(x => x.id !== r.id) }))}><Icon name="trash" size={14} color="#fff" /></Btn> },
      ]} rows={sorted} /></Card>
      {modal && <Modal title="Evento de Manejo" onClose={() => setModal(false)}><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <Select label="Tipo" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={types} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><Input label="Talhão" value={form.talhao} onChange={v => setForm(f => ({ ...f, talhao: v }))} /><Input label="Área (ha)" type="number" value={form.area} onChange={v => setForm(f => ({ ...f, area: v }))} /></div>
        <Input label="Descrição" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><Input label="Produto/Insumo" value={form.product} onChange={v => setForm(f => ({ ...f, product: v }))} /><Input label="Dose/Lâmina" value={form.dose} onChange={v => setForm(f => ({ ...f, dose: v }))} /></div>
        <Input label="Próxima aplicação" type="date" value={form.nextDate} onChange={v => setForm(f => ({ ...f, nextDate: v }))} />
        <Input label="Obs" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
      </div></Modal>}
    </div>
  );
}
