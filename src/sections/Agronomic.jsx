import { useState } from "react";
import { C } from "../ui/theme";
import { uid, today, fmtDate } from "../lib/format";
import { listaSugestoes, valvulaOptions } from "../lib/registros";
import { Card, Btn, Badge, Icon, Input, Select, Modal, Table, RowActions } from "../ui";

// ─── Agronomic ───────────────────────────────────────────────────────────────
const EMPTY = { date: "", type: "poda", talhao: "", title: "", product: "", dose: "", area: "", notes: "", nextDate: "" };

export default function Agronomic({ data, setData }) {
  const [modal, setModal] = useState(null); // null | "new" | "edit" | "copy"
  const [form, setForm] = useState(EMPTY);
  const types = [{ value: "poda", label: "Poda" }, { value: "adubacao", label: "Adubação de Cobertura" }, { value: "fertirrigacao", label: "Fertirrigação" }, { value: "irrigacao", label: "Irrigação" }, { value: "fitossanitario", label: "Fitossanitário" }, { value: "colheita", label: "Colheita" }, { value: "outro", label: "Outro" }];
  const colors = { poda: C.primary, adubacao: C.accentDark, fertirrigacao: C.blue, irrigacao: "#00BCD4", fitossanitario: C.danger, colheita: C.primaryLight, outro: C.muted };
  const openNew = () => { setForm({ ...EMPTY, date: today() }); setModal("new"); };
  const openEdit = (r) => { setForm({ ...EMPTY, ...r }); setModal("edit"); };
  const openCopy = (r) => { const { id, ...rest } = r; setForm({ ...EMPTY, ...rest, date: today() }); setModal("copy"); };
  const save = () => {
    if (modal === "edit") setData(d => ({ ...d, agronomicEvents: d.agronomicEvents.map(x => x.id === form.id ? { ...form } : x) }));
    else setData(d => ({ ...d, agronomicEvents: [{ ...form, id: uid() }, ...d.agronomicEvents] }));
    setModal(null);
  };
  const sorted = [...data.agronomicEvents].sort((a, b) => b.date.localeCompare(a.date));
  const valvulas = valvulaOptions(data.agronomicEvents.map(e => e.talhao), data.applications.map(a => a.talhao));
  const produtos = listaSugestoes([], data.agronomicEvents.map(e => e.product), data.inputPurchases.map(i => i.name));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0, color: C.text }}>Manejo Agronômico</h2><Btn onClick={openNew}><Icon name="plus" size={16} color="#fff" /> Novo Evento</Btn></div>
      <Card><Table cols={[
        { key: "date", label: "Data", render: r => fmtDate(r.date) }, { key: "type", label: "Tipo", render: r => <Badge color={colors[r.type]}>{types.find(t => t.value === r.type)?.label || r.type}</Badge> },
        { key: "talhao", label: "Válvula" }, { key: "title", label: "Descrição" }, { key: "product", label: "Produto" }, { key: "dose", label: "Dose/Lâmina" }, { key: "area", label: "ha" },
        { key: "nextDate", label: "Próxima", render: r => r.nextDate ? fmtDate(r.nextDate) : "-" }, { key: "notes", label: "Obs" },
        { key: "acoes", label: "", render: r => <RowActions onEdit={() => openEdit(r)} onCopy={() => openCopy(r)} onDelete={() => setData(d => ({ ...d, agronomicEvents: d.agronomicEvents.filter(x => x.id !== r.id) }))} /> },
      ]} rows={sorted} /></Card>
      {modal && <Modal title={modal === "edit" ? "Editar — Evento de Manejo" : modal === "copy" ? "Copiar — Evento de Manejo" : "Evento de Manejo"} onClose={() => setModal(null)}><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <Select label="Tipo" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={types} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><Select label="Válvula" value={form.talhao} onChange={v => setForm(f => ({ ...f, talhao: v }))} options={valvulas} /><Input label="Área (ha)" type="number" value={form.area} onChange={v => setForm(f => ({ ...f, area: v }))} /></div>
        <Input label="Descrição" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><Input label="Produto/Insumo" value={form.product} onChange={v => setForm(f => ({ ...f, product: v }))} suggestions={produtos} /><Input label="Dose/Lâmina" value={form.dose} onChange={v => setForm(f => ({ ...f, dose: v }))} /></div>
        <Input label="Próxima aplicação" type="date" value={form.nextDate} onChange={v => setForm(f => ({ ...f, nextDate: v }))} />
        <Input label="Obs" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
      </div></Modal>}
    </div>
  );
}
