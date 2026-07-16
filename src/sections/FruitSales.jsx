import { useState } from "react";
import { C } from "../ui/theme";
import { uid, today, fmt, fmtDate, fmtMoney } from "../lib/format";
import { Card, Btn, Badge, Icon, Input, Select, Modal, Table, StatCard } from "../ui";

// ─── FruitSales ──────────────────────────────────────────────────────────────
export default function FruitSales({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: today(), type: "verde", buyer: "", qty: "", unit: "kg", unitPrice: "", nf: "", notes: "" });
  const types = [{ value: "verde", label: "Goiaba Verde" }, { value: "polpa", label: "Polpa" }, { value: "madura", label: "Goiaba Madura" }, { value: "refugo", label: "Refugo" }];
  const save = () => { const total = Number(form.qty) * Number(form.unitPrice); setData(d => ({ ...d, fruitSales: [{ ...form, total, id: uid() }, ...d.fruitSales] })); setModal(false); };
  const totalQty = data.fruitSales.reduce((s, x) => s + Number(x.qty || 0), 0);
  const totalValue = data.fruitSales.reduce((s, x) => s + Number(x.total || 0), 0);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0, color: C.text }}>Venda de Frutas</h2><Btn onClick={() => { setForm({ date: today(), type: "verde", buyer: "", qty: "", unit: "kg", unitPrice: "", nf: "", notes: "" }); setModal(true); }}><Icon name="plus" size={16} color="#fff" /> Nova Venda</Btn></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}><StatCard label="Total Vendido" value={`${fmt(totalQty)} kg`} icon="fruit" color={C.primary} /><StatCard label="Receita" value={fmtMoney(totalValue)} icon="finance" color={C.primaryLight} /></div>
      <Card><Table cols={[
        { key: "date", label: "Data", render: r => fmtDate(r.date) }, { key: "type", label: "Produto", render: r => <Badge color={r.type === "polpa" ? C.accentDark : C.primary}>{types.find(t => t.value === r.type)?.label}</Badge> },
        { key: "buyer", label: "Comprador" }, { key: "qty", label: "Qtd", render: r => `${r.qty} ${r.unit}` }, { key: "unitPrice", label: "Preço", render: r => fmtMoney(r.unitPrice) },
        { key: "total", label: "Total", render: r => <strong style={{ color: C.primary }}>{fmtMoney(r.total)}</strong> }, { key: "nf", label: "NF" },
        { key: "del", label: "", render: r => <Btn size="sm" variant="danger" onClick={() => setData(d => ({ ...d, fruitSales: d.fruitSales.filter(x => x.id !== r.id) }))}><Icon name="trash" size={14} color="#fff" /></Btn> },
      ]} rows={data.fruitSales} /></Card>
      {modal && <Modal title="Venda de Fruta" onClose={() => setModal(false)}><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <Select label="Produto" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={types} />
        <Input label="Comprador" value={form.buyer} onChange={v => setForm(f => ({ ...f, buyer: v }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}><Input label="Qtd" type="number" value={form.qty} onChange={v => setForm(f => ({ ...f, qty: v }))} /><Input label="Unid" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} /><Input label="Preço" type="number" value={form.unitPrice} onChange={v => setForm(f => ({ ...f, unitPrice: v }))} /></div>
        <Input label="NF" value={form.nf} onChange={v => setForm(f => ({ ...f, nf: v }))} />
        <div style={{ textAlign: "right", fontWeight: 700, color: C.primary }}>Total: {fmtMoney(Number(form.qty) * Number(form.unitPrice))}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
      </div></Modal>}
    </div>
  );
}
