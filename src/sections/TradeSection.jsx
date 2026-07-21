import { useState } from "react";
import { C } from "../ui/theme";
import { uid, today, fmtDate, fmtMoney } from "../lib/format";
import { nomesUsados, counterSummary } from "../lib/registros";
import { Card, Btn, Icon, Input, Modal, Table } from "../ui";

// ─── TradeSection (Insumos / Materiais) ──────────────────────────────────────
export default function TradeSection({ title, listKey, itemLabel, data, setData, updateStock }) {
  const [tab, setTab] = useState("compra");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type: "compra", date: today(), name: "", counter: "", qty: "", unit: "kg", unitPrice: "", nf: "", description: "" });
  const list = data[listKey].filter(x => x.type === tab);
  const contrapartes = counterSummary(data[listKey], tab);
  const nomesContraparte = nomesUsados(data[listKey], "counter");
  const nomesItens = nomesUsados(data[listKey], "name");
  const rotuloContraparte = tab === "compra" ? "Fornecedor / Loja" : "Comprador";
  const save = () => {
    const total = Number(form.qty) * Number(form.unitPrice);
    setData(d => ({ ...d, [listKey]: [{ ...form, total, id: uid() }, ...d[listKey]] }));
    if (updateStock && tab === "compra" && form.name) {
      setData(d => {
        const idx = d.stockItems.findIndex(s => s.name.toLowerCase() === form.name.toLowerCase());
        if (idx >= 0) { const u = [...d.stockItems]; u[idx] = { ...u[idx], qty: Number(u[idx].qty) + Number(form.qty) }; return { ...d, stockItems: u }; }
        return { ...d, stockItems: [{ id: uid(), name: form.name, category: "insumo", unit: form.unit, qty: form.qty, minQty: 0 }, ...d.stockItems] };
      });
    }
    setModal(false);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text }}>{title}</h2>
        <Btn onClick={() => { setForm({ type: tab, date: today(), name: "", counter: "", qty: "", unit: "kg", unitPrice: "", nf: "", description: "" }); setModal(true); }}><Icon name="plus" size={16} color="#fff" /> Novo Lançamento</Btn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["compra", "venda"].map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: `2px solid ${tab === t ? C.primary : C.border}`, background: tab === t ? C.primary : "transparent", color: tab === t ? "#fff" : C.muted, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      <Card>
        <Table cols={[
          { key: "date", label: "Data", render: r => fmtDate(r.date) },
          { key: "name", label: itemLabel },
          { key: "description", label: "Descrição" },
          { key: "counter", label: tab === "compra" ? "Fornecedor / Loja" : "Comprador" },
          { key: "qty", label: "Qtd", render: r => `${r.qty} ${r.unit}` },
          { key: "unitPrice", label: "Preço", render: r => fmtMoney(r.unitPrice) },
          { key: "total", label: "Total", render: r => <strong>{fmtMoney(r.total)}</strong> },
          { key: "nf", label: "NF" },
          { key: "del", label: "", render: r => <Btn size="sm" variant="danger" onClick={() => setData(d => ({ ...d, [listKey]: d[listKey].filter(x => x.id !== r.id) }))}><Icon name="trash" size={14} color="#fff" /></Btn> },
        ]} rows={list} />
      </Card>
      <Card style={{ marginTop: 16 }}>
        <h4 style={{ margin: "0 0 12px", color: C.text, fontSize: 15 }}>🏪 Registro por {tab === "compra" ? "loja / fornecedor" : "comprador"}</h4>
        <Table cols={[
          { key: "nome", label: rotuloContraparte },
          { key: "produtos", label: itemLabel + "s" },
          { key: "compras", label: tab === "compra" ? "Compras" : "Vendas", render: r => `${r.compras}` },
          { key: "total", label: tab === "compra" ? "Total gasto" : "Total recebido", render: r => <strong style={{ color: tab === "compra" ? C.danger : C.primary }}>{fmtMoney(r.total)}</strong> },
          { key: "ultima", label: "Último", render: r => fmtDate(r.ultima) },
        ]} rows={contrapartes} empty="Nenhum lançamento ainda." />
      </Card>
      {modal && (
        <Modal title={`${tab === "compra" ? "Compra" : "Venda"} — ${title}`} onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <Input label={itemLabel} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} suggestions={nomesItens} required />
            <Input label="Descrição" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
            <Input label={rotuloContraparte} value={form.counter} onChange={v => setForm(f => ({ ...f, counter: v }))} suggestions={nomesContraparte} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Input label="Qtd" type="number" value={form.qty} onChange={v => setForm(f => ({ ...f, qty: v }))} />
              <Input label="Unidade" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} />
              <Input label="Preço unit." type="number" value={form.unitPrice} onChange={v => setForm(f => ({ ...f, unitPrice: v }))} />
            </div>
            <Input label="Nota Fiscal" value={form.nf} onChange={v => setForm(f => ({ ...f, nf: v }))} />
            <div style={{ textAlign: "right", fontWeight: 700, color: C.primary }}>Total: {fmtMoney(Number(form.qty) * Number(form.unitPrice))}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
