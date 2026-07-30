import { useState } from "react";
import { C } from "../ui/theme";
import { uid, today, fmt, fmtDate, fmtMoney } from "../lib/format";
import { CAIXA_KG, isCaixa, saleKg, buyerSummary, paymentSummary } from "../lib/sales";
import { Card, Btn, Badge, Icon, Input, Select, Modal, Table, StatCard, RowActions } from "../ui";

// ─── FruitSales ──────────────────────────────────────────────────────────────
const EMPTY_FORM = { date: "", type: "verde", buyer: "", qty: "", unit: "kg", unitPrice: "", notes: "", payStatus: "a_receber", payMethod: "pix", holder: "comigo" };

export default function FruitSales({ data, setData }) {
  const [modal, setModal] = useState(null); // null | "new" | "edit"
  const [form, setForm] = useState(EMPTY_FORM);
  const types = [{ value: "verde", label: "Goiaba Verde" }, { value: "polpa", label: "Polpa" }, { value: "madura", label: "Goiaba Madura" }, { value: "refugo", label: "Refugo" }];
  const holderLabel = (h) => h === "matheus" ? "com Matheus" : h === "comigo" ? "comigo" : null;
  const togglePay = (id) => setData(d => ({ ...d, fruitSales: d.fruitSales.map(x => x.id === id ? { ...x, payStatus: x.payStatus === "recebido" ? "a_receber" : "recebido" } : x) }));
  const openNew = () => { setForm({ ...EMPTY_FORM, date: today() }); setModal("new"); };
  const openEdit = (r) => { setForm({ ...EMPTY_FORM, ...r, unit: isCaixa(r) ? "caixa" : (r.unit || "kg") }); setModal("edit"); };
  const openCopy = (r) => { const { id, ...rest } = r; setForm({ ...EMPTY_FORM, ...rest, unit: isCaixa(r) ? "caixa" : (r.unit || "kg"), date: today() }); setModal("copy"); };
  const save = () => {
    const total = Number(form.qty) * Number(form.unitPrice);
    if (modal === "edit") setData(d => ({ ...d, fruitSales: d.fruitSales.map(x => x.id === form.id ? { ...form, total } : x) }));
    else setData(d => ({ ...d, fruitSales: [{ ...form, total, id: uid() }, ...d.fruitSales] }));
    setModal(null);
  };
  const totalKg = data.fruitSales.reduce((s, x) => s + saleKg(x), 0);
  const buyers = buyerSummary(data.fruitSales);
  const buyerNames = [...new Set(data.fruitSales.map(x => (x.buyer || "").trim()).filter(Boolean))].sort();
  const caixa = paymentSummary(data.fruitSales);
  const totalValue = data.fruitSales.reduce((s, x) => s + Number(x.total || 0), 0);
  const precoMedioKg = totalKg > 0 ? totalValue / totalKg : 0;
  const precoMedioCaixa = precoMedioKg * CAIXA_KG;
  const precoKg = isCaixa(form) && Number(form.unitPrice) > 0 ? Number(form.unitPrice) / CAIXA_KG : null;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0, color: C.text }}>Venda de Frutas</h2><Btn onClick={openNew}><Icon name="plus" size={16} color="#fff" /> Nova Venda</Btn></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 16 }}><StatCard label="Produção Vendida" value={`${fmt(totalKg, 0)} kg`} icon="fruit" color={C.primary} sub={`= ${fmt(totalKg / CAIXA_KG, 1)} caixas de ${CAIXA_KG} kg`} /><StatCard label="Receita" value={fmtMoney(totalValue)} icon="finance" color={C.primaryLight} /><StatCard label="Preço médio por caixa" value={totalKg > 0 ? fmtMoney(precoMedioCaixa) : "—"} icon="fruit" color={C.accentDark} sub={totalKg > 0 ? `${fmtMoney(precoMedioKg)} / kg · caixa de ${CAIXA_KG} kg` : "sem vendas lançadas"} /></div>
      <Card style={{ marginBottom: 16 }}>
        <h4 style={{ margin: "0 0 12px", color: C.text, fontSize: 15 }}>💰 Resumo do dinheiro</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: caixa.aReceber > 0 ? C.dangerLight : C.green50, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>A receber</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: caixa.aReceber > 0 ? C.danger : C.primary }}>{fmtMoney(caixa.aReceber)}</div>
          </div>
          <div style={{ background: C.green50, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Recebido</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{fmtMoney(caixa.recebido)}</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Do recebido, com quem está</div>
          {caixa.porPessoa.map(p => (
            <div key={p.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, padding: "7px 10px", background: C.bg, borderRadius: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.label}</span>
              <span style={{ textAlign: "right" }}>
                <strong style={{ fontSize: 14, color: C.primary }}>{fmtMoney(p.total)}</strong>
                {p.total > 0 && <span style={{ fontSize: 11, color: C.muted, display: "block" }}>pix {fmtMoney(p.pix)} · dinheiro {fmtMoney(p.dinheiro)}</span>}
              </span>
            </div>
          ))}
        </div>
      </Card>
      <Card><Table cols={[
        { key: "date", label: "Data", render: r => fmtDate(r.date) }, { key: "type", label: "Produto", render: r => <Badge color={r.type === "polpa" ? C.accentDark : C.primary}>{types.find(t => t.value === r.type)?.label}</Badge> },
        { key: "buyer", label: "Comprador" }, { key: "qty", label: "Qtd", sortValue: r => saleKg(r), render: r => isCaixa(r) ? `${r.qty} cx (${fmt(saleKg(r), 0)} kg)` : `${r.qty} ${r.unit}` }, { key: "unitPrice", label: "Preço", render: r => fmtMoney(r.unitPrice) },
        { key: "total", label: "Total", render: r => <strong style={{ color: C.primary }}>{fmtMoney(r.total)}</strong> },
        { key: "pay", label: "Pagamento", sortValue: r => (r.payStatus === "recebido" ? "1 recebido" : "0 a receber"), render: r => (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
            <button onClick={() => togglePay(r.id)} title="Clique para alternar entre a receber e recebido" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <Badge color={r.payStatus === "recebido" ? C.primaryLight : C.accentDark}>{r.payStatus === "recebido" ? "✓ recebido" : "a receber"}</Badge>
            </button>
            {(r.payMethod || holderLabel(r.holder)) && <span style={{ fontSize: 11, color: C.muted }}>{[r.payMethod, holderLabel(r.holder)].filter(Boolean).join(" · ")}</span>}
          </div>
        ) },
        { key: "a", label: "", render: r => <RowActions
          extra={r.payStatus === "recebido"
            ? <Btn size="sm" variant="ghost" onClick={() => togglePay(r.id)}>↩ Desfazer</Btn>
            : <Btn size="sm" variant="accent" onClick={() => togglePay(r.id)}><Icon name="check" size={14} color="#1A2E1A" /> Receber</Btn>}
          onEdit={() => openEdit(r)} onCopy={() => openCopy(r)} onDelete={() => setData(d => ({ ...d, fruitSales: d.fruitSales.filter(x => x.id !== r.id) }))} /> },
      ]} rows={data.fruitSales} /></Card>
      <Card style={{ marginTop: 16 }}>
        <h4 style={{ margin: "0 0 12px", color: C.text, fontSize: 15 }}>🧾 Registro por comprador</h4>
        <Table cols={[
          { key: "nome", label: "Comprador" },
          { key: "caixas", label: "Caixas", render: r => r.caixas ? fmt(r.caixas, 0) : "-" },
          { key: "kg", label: "Kg (total)", render: r => <strong>{fmt(r.kg, 0)} kg</strong> },
          { key: "total", label: "Comprou (R$)", render: r => fmtMoney(r.total) },
          { key: "aReceber", label: "A receber", render: r => r.aReceber > 0 ? <strong style={{ color: C.danger }}>{fmtMoney(r.aReceber)}</strong> : <Badge color={C.primaryLight}>✓ em dia</Badge> },
        ]} rows={buyers} empty="Nenhuma venda lançada." />
      </Card>
      {modal && <Modal title={modal === "edit" ? "Editar Venda" : modal === "copy" ? "Copiar Venda" : "Venda de Fruta"} onClose={() => setModal(null)}><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <Select label="Produto" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={types} />
        <Input label="Comprador" value={form.buyer} onChange={v => setForm(f => ({ ...f, buyer: v }))} suggestions={buyerNames} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}><Input label="Qtd" type="number" value={form.qty} onChange={v => setForm(f => ({ ...f, qty: v }))} /><Select label="Unid" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} options={[{ value: "kg", label: "kg" }, { value: "caixa", label: `caixa (${CAIXA_KG} kg)` }]} /><Input label={form.unit === "caixa" ? "Preço da caixa" : "Preço do kg"} type="number" value={form.unitPrice} onChange={v => setForm(f => ({ ...f, unitPrice: v }))} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Select label="Situação" value={form.payStatus} onChange={v => setForm(f => ({ ...f, payStatus: v }))} options={[{ value: "a_receber", label: "A receber" }, { value: "recebido", label: "Recebido" }]} />
          <Select label="Forma" value={form.payMethod} onChange={v => setForm(f => ({ ...f, payMethod: v }))} options={[{ value: "pix", label: "Pix" }, { value: "dinheiro", label: "Dinheiro" }]} />
          <Select label="Dinheiro com" value={form.holder} onChange={v => setForm(f => ({ ...f, holder: v }))} options={[{ value: "comigo", label: "Comigo" }, { value: "matheus", label: "Matheus" }]} />
        </div>
        {form.unit === "caixa" && Number(form.qty) > 0 && (
          <div style={{ background: C.green50, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.textSoft }}>
            {form.qty} caixa(s) = <strong>{fmt(saleKg(form), 0)} kg</strong>{precoKg != null && <> — preço do kg: <strong>{fmtMoney(precoKg)}</strong></>}
          </div>
        )}
        <div style={{ textAlign: "right", fontWeight: 700, color: C.primary }}>Total: {fmtMoney(Number(form.qty) * Number(form.unitPrice))}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
      </div></Modal>}
    </div>
  );
}
