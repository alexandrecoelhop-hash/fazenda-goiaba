import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C } from "../ui/theme";
import { uid, today, fmtDate, fmtMoney } from "../lib/format";
import { Card, Btn, Icon, Input, Modal, Table, StatCard } from "../ui";

// ─── Energy ──────────────────────────────────────────────────────────────────
export default function Energy({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: today(), month: "", value: "", kwh: "", notes: "" });
  const save = () => { setData(d => ({ ...d, energyBills: [{ ...form, id: uid() }, ...d.energyBills] })); setModal(false); };
  const total = data.energyBills.reduce((s, x) => s + Number(x.value || 0), 0);
  const chartData = [...data.energyBills].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(x => ({ mes: x.month || x.date, valor: Number(x.value || 0) }));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0, color: C.text }}>Energia Elétrica</h2><Btn onClick={() => { setForm({ date: today(), month: "", value: "", kwh: "", notes: "" }); setModal(true); }}><Icon name="plus" size={16} color="#fff" /> Lançar Conta</Btn></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
        <StatCard label="Total Energia" value={fmtMoney(total)} icon="energy" color={C.accentDark} />
        <Card><h4 style={{ margin: "0 0 8px", fontSize: 14, color: C.text }}>Evolução do consumo</h4>
          {chartData.length === 0 ? <p style={{ color: C.muted, fontSize: 13 }}>Sem dados.</p> :
            <ResponsiveContainer width="100%" height={140}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mes" fontSize={10} /><YAxis fontSize={10} /><Tooltip formatter={(v) => fmtMoney(v)} /><Line dataKey="valor" name="R$" stroke={C.accentDark} strokeWidth={2} /></LineChart></ResponsiveContainer>}
        </Card>
      </div>
      <Card><Table cols={[
        { key: "date", label: "Vencimento", render: r => fmtDate(r.date) }, { key: "month", label: "Referência" }, { key: "kwh", label: "kWh" },
        { key: "value", label: "Valor", render: r => <strong>{fmtMoney(r.value)}</strong> }, { key: "notes", label: "Obs" },
        { key: "del", label: "", render: r => <Btn size="sm" variant="danger" onClick={() => setData(d => ({ ...d, energyBills: d.energyBills.filter(x => x.id !== r.id) }))}><Icon name="trash" size={14} color="#fff" /></Btn> },
      ]} rows={data.energyBills} /></Card>
      {modal && <Modal title="Conta de Energia" onClose={() => setModal(false)}><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Mês referência" value={form.month} onChange={v => setForm(f => ({ ...f, month: v }))} placeholder="Junho/2025" />
        <Input label="Vencimento" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><Input label="kWh" type="number" value={form.kwh} onChange={v => setForm(f => ({ ...f, kwh: v }))} /><Input label="Valor (R$)" type="number" value={form.value} onChange={v => setForm(f => ({ ...f, value: v }))} /></div>
        <Input label="Obs" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
      </div></Modal>}
    </div>
  );
}
