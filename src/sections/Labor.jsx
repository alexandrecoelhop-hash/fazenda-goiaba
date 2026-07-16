import { useState } from "react";
import { C } from "../ui/theme";
import { uid, today, fmtDate, fmtMoney } from "../lib/format";
import { Card, Btn, Badge, Icon, Input, Select, Modal, Table, StatCard } from "../ui";

// ─── Labor ───────────────────────────────────────────────────────────────────
export default function Labor({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: today(), worker: "", service: "", days: "", dailyRate: "", type: "diarista", notes: "" });
  const types = ["diarista", "mensalista", "empreitada", "temporário"];
  const save = () => { const total = Number(form.days) * Number(form.dailyRate); setData(d => ({ ...d, laborEntries: [{ ...form, total, id: uid() }, ...d.laborEntries] })); setModal(false); };
  const totalLabor = data.laborEntries.reduce((s, x) => s + Number(x.total || 0), 0);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0, color: C.text }}>Mão de Obra</h2><Btn onClick={() => { setForm({ date: today(), worker: "", service: "", days: "", dailyRate: "", type: "diarista", notes: "" }); setModal(true); }}><Icon name="plus" size={16} color="#fff" /> Novo</Btn></div>
      <div style={{ marginBottom: 16 }}><StatCard label="Total M.O." value={fmtMoney(totalLabor)} icon="labor" color={C.purple} /></div>
      <Card><Table cols={[
        { key: "date", label: "Data", render: r => fmtDate(r.date) }, { key: "worker", label: "Trabalhador" }, { key: "service", label: "Serviço" },
        { key: "type", label: "Tipo", render: r => <Badge color={C.purple}>{r.type}</Badge> }, { key: "days", label: "Dias/Qtd" },
        { key: "dailyRate", label: "Valor", render: r => fmtMoney(r.dailyRate) }, { key: "total", label: "Total", render: r => <strong>{fmtMoney(r.total)}</strong> },
        { key: "notes", label: "Obs" }, { key: "del", label: "", render: r => <Btn size="sm" variant="danger" onClick={() => setData(d => ({ ...d, laborEntries: d.laborEntries.filter(x => x.id !== r.id) }))}><Icon name="trash" size={14} color="#fff" /></Btn> },
      ]} rows={data.laborEntries} /></Card>
      {modal && <Modal title="Mão de Obra" onClose={() => setModal(false)}><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <Input label="Trabalhador / Equipe" value={form.worker} onChange={v => setForm(f => ({ ...f, worker: v }))} required />
        <Input label="Serviço" value={form.service} onChange={v => setForm(f => ({ ...f, service: v }))} />
        <Select label="Tipo" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={types.map(t => ({ value: t, label: t }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><Input label="Dias/Qtd" type="number" value={form.days} onChange={v => setForm(f => ({ ...f, days: v }))} /><Input label="Valor unit." type="number" value={form.dailyRate} onChange={v => setForm(f => ({ ...f, dailyRate: v }))} /></div>
        <Input label="Obs" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
        <div style={{ textAlign: "right", fontWeight: 700, color: C.primary }}>Total: {fmtMoney(Number(form.days) * Number(form.dailyRate))}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
      </div></Modal>}
    </div>
  );
}
