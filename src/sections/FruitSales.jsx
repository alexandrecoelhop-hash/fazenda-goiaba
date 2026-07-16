import { useState } from "react";
import { C } from "../ui/theme";
import { uid, today, fmt, fmtDate, fmtMoney } from "../lib/format";
import { CAIXA_KG, saleKg } from "../lib/sales";
import { Card, Btn, Badge, Icon, Input, Select, Modal, Table, StatCard } from "../ui";

// ─── FruitSales ──────────────────────────────────────────────────────────────
export default function FruitSales({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: today(), type: "verde", buyer: "", qty: "", unit: "kg", unitPrice: "", nf: "", notes: "", payStatus: "a_receber", payMethod: "pix", holder: "comigo" });
  const types = [{ value: "verde", label: "Goiaba Verde" }, { value: "polpa", label: "Polpa" }, { value: "madura", label: "Goiaba Madura" }, { value: "refugo", label: "Refugo" }];
  const holderLabel = (h) => h === "matheus" ? "com Matheus" : h === "comigo" ? "comigo" : null;
  const togglePay = (id) => setData(d => ({ ...d, fruitSales: d.fruitSales.map(x => x.id === id ? { ...x, payStatus: x.payStatus === "recebido" ? "a_receber" : "recebido" } : x) }));
  const save = () => { const total = Number(form.qty) * Number(form.unitPrice); setData(d => ({ ...d, fruitSales: [{ ...form, total, id: uid() }, ...d.fruitSales] })); setModal(false); };
  const totalKg = data.fruitSales.reduce((s, x) => s + saleKg(x), 0);
  const totalValue = data.fruitSales.reduce((s, x) => s + Number(x.total || 0), 0);
  const precoKg = form.unit === "caixa" && Number(form.unitPrice) > 0 ? Number(form.unitPrice) / CAIXA_KG : null;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0, color: C.text }}>Venda de Frutas</h2><Btn onClick={() => { setForm({ date: today(), type: "verde", buyer: "", qty: "", unit: "kg", unitPrice: "", nf: "", notes: "", payStatus: "a_receber", payMethod: "pix", holder: "comigo" }); setModal(true); }}><Icon name="plus" size={16} color="#fff" /> Nova Venda</Btn></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}><StatCard label="Produção Vendida" value={`${fmt(totalKg, 0)} kg`} icon="fruit" color={C.primary} sub={`caixas convertidas a ${CAIXA_KG} kg`} /><StatCard label="Receita" value={fmtMoney(totalValue)} icon="finance" color={C.primaryLight} /></div>
      <Card><Table cols={[
        { key: "date", label: "Data", render: r => fmtDate(r.date) }, { key: "type", label: "Produto", render: r => <Badge color={r.type === "polpa" ? C.accentDark : C.primary}>{types.find(t => t.value === r.type)?.label}</Badge> },
        { key: "buyer", label: "Comprador" }, { key: "qty", label: "Qtd", render: r => r.unit === "caixa" ? `${r.qty} cx (${fmt(saleKg(r), 0)} kg)` : `${r.qty} ${r.unit}` }, { key: "unitPrice", label: "Preço", render: r => fmtMoney(r.unitPrice) },
        { key: "total", label: "Total", render: r => <strong style={{ color: C.primary }}>{fmtMoney(r.total)}</strong> },
        { key: "pay", label: "Pagamento", render: r => (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
            <button onClick={() => togglePay(r.id)} title="Clique para alternar entre a receber e recebido" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <Badge color={r.payStatus === "recebido" ? C.primaryLight : C.accentDark}>{r.payStatus === "recebido" ? "✓ recebido" : "a receber"}</Badge>
            </button>
            {(r.payMethod || holderLabel(r.holder)) && <span style={{ fontSize: 11, color: C.muted }}>{[r.payMethod, holderLabel(r.holder)].filter(Boolean).join(" · ")}</span>}
          </div>
        ) },
        { key: "nf", label: "NF" },
        { key: "del", label: "", render: r => <Btn size="sm" variant="danger" onClick={() => setData(d => ({ ...d, fruitSales: d.fruitSales.filter(x => x.id !== r.id) }))}><Icon name="trash" size={14} color="#fff" /></Btn> },
      ]} rows={data.fruitSales} /></Card>
      {modal && <Modal title="Venda de Fruta" onClose={() => setModal(false)}><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <Select label="Produto" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={types} />
        <Input label="Comprador" value={form.buyer} onChange={v => setForm(f => ({ ...f, buyer: v }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}><Input label="Qtd" type="number" value={form.qty} onChange={v => setForm(f => ({ ...f, qty: v }))} /><Select label="Unid" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} options={[{ value: "kg", label: "kg" }, { value: "caixa", label: `caixa (${CAIXA_KG} kg)` }]} /><Input label={form.unit === "caixa" ? "Preço da caixa" : "Preço do kg"} type="number" value={form.unitPrice} onChange={v => setForm(f => ({ ...f, unitPrice: v }))} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Select label="Situação" value={form.payStatus} onChange={v => setForm(f => ({ ...f, payStatus: v }))} options={[{ value: "a_receber", label: "A receber" }, { value: "recebido", label: "Recebido" }]} />
          <Select label="Forma" value={form.payMethod} onChange={v => setForm(f => ({ ...f, payMethod: v }))} options={[{ value: "pix", label: "Pix" }, { value: "dinheiro", label: "Dinheiro" }]} />
          <Select label="Dinheiro com" value={form.holder} onChange={v => setForm(f => ({ ...f, holder: v }))} options={[{ value: "comigo", label: "Comigo" }, { value: "matheus", label: "Matheus" }]} />
        </div>
        <Input label="NF" value={form.nf} onChange={v => setForm(f => ({ ...f, nf: v }))} />
        {form.unit === "caixa" && Number(form.qty) > 0 && (
          <div style={{ background: C.green50, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.textSoft }}>
            {form.qty} caixa(s) = <strong>{fmt(saleKg(form), 0)} kg</strong>{precoKg != null && <> — preço do kg: <strong>{fmtMoney(precoKg)}</strong></>}
          </div>
        )}
        <div style={{ textAlign: "right", fontWeight: 700, color: C.primary }}>Total: {fmtMoney(Number(form.qty) * Number(form.unitPrice))}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
      </div></Modal>}
    </div>
  );
}
