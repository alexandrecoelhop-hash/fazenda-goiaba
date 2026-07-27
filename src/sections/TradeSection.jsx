import { useState } from "react";
import { C } from "../ui/theme";
import { uid, today, fmt, fmtDate, fmtMoney } from "../lib/format";
import { nomesUsados, counterSummary, listaSugestoes, TIPOS_PRODUTO } from "../lib/registros";
import { Card, Btn, Icon, Input, Select, Modal, Table, RowActions } from "../ui";

// Unidades "embalagem" que contêm uma quantidade de uma unidade base (kg ou L)
const PACK_CFG = {
  sc: { base: "kg", rotulo: "Kg por saco", opcoes: [25, 50] },
  bombona: { base: "L", rotulo: "Litros por embalagem", opcoes: [5, 20] },
};
const UNID_BASE = [
  { value: "kg", label: "Kg" },
  { value: "sc", label: "Saco" },
  { value: "L", label: "Litro" },
  { value: "bombona", label: "Bombona / Galão" },
  { value: "un", label: "Unidade" },
];
// Normaliza unidades antigas/variações para os valores canônicos do seletor
const normUnit = (u) => {
  const s = (u || "").trim().toLowerCase();
  if (["sc", "saco", "sacos", "sc."].includes(s)) return "sc";
  if (["l", "lt", "litro", "litros"].includes(s)) return "L";
  if (["kg", "quilo", "quilos"].includes(s)) return "kg";
  if (["un", "und", "unid", "unidade"].includes(s)) return "un";
  if (["bombona", "galao", "galão", "bombona/galão", "gl"].includes(s)) return "bombona";
  return (u || "").trim();
};
// Valor por kg/L de um lançamento (usa a quantidade por embalagem quando houver)
const baseInfo = (r) => {
  const cfg = PACK_CFG[r.unit];
  const packSize = Number(r.packSize) || 0, qtd = Number(r.qty) || 0, preco = Number(r.unitPrice) || 0;
  if (cfg && packSize > 0 && preco > 0) return { base: cfg.base, totalBase: qtd * packSize, porBase: preco / packSize, pack: true };
  if (r.unit === "kg" && preco > 0) return { base: "kg", totalBase: qtd, porBase: preco, pack: false };
  if (r.unit === "L" && preco > 0) return { base: "L", totalBase: qtd, porBase: preco, pack: false };
  return null;
};

// ─── TradeSection (Insumos / Materiais) ──────────────────────────────────────
export default function TradeSection({ title, listKey, itemLabel, data, setData, updateStock }) {
  const [tab, setTab] = useState("compra");
  const [modal, setModal] = useState(null); // null | "new" | "edit" | "copy"
  const EMPTY = { type: tab, date: "", name: "", tipo: "", counter: "", qty: "", unit: "kg", unitPrice: "", nf: "", description: "", packSize: "" };
  const [form, setForm] = useState(EMPTY);
  const list = data[listKey].filter(x => x.type === tab);
  const contrapartes = counterSummary(data[listKey], tab);
  const nomesContraparte = nomesUsados(data[listKey], "counter");
  const nomesItens = nomesUsados(data[listKey], "name");
  // Tipos: padrões (adubo foliar, inseticida...) + os que você já usou em Insumos e Materiais
  const tipos = listaSugestoes(TIPOS_PRODUTO, data.inputPurchases.map(x => x.tipo), data.materialTransactions.map(x => x.tipo));
  // Opções de unidade: as padrão + quaisquer unidades já usadas (mantém dados antigos)
  const unidadeOpcoes = (() => {
    const vistos = new Set(UNID_BASE.map(o => o.value));
    const arr = [...UNID_BASE];
    data[listKey].forEach(x => { const u = normUnit(x.unit); if (u && !vistos.has(u)) { vistos.add(u); arr.push({ value: u, label: u }); } });
    return arr;
  })();
  const rotuloContraparte = tab === "compra" ? "Fornecedor / Loja" : "Comprador";
  const openNew = () => { setForm({ ...EMPTY, type: tab, date: today() }); setModal("new"); };
  const openEdit = (r) => { setForm({ ...EMPTY, ...r, unit: normUnit(r.unit) }); setModal("edit"); };
  const openCopy = (r) => { const { id, ...rest } = r; setForm({ ...EMPTY, ...rest, unit: normUnit(rest.unit), date: today() }); setModal("copy"); };
  const save = () => {
    const total = Number(form.qty) * Number(form.unitPrice);
    if (modal === "edit") {
      // editar não mexe no estoque (evita contar a compra duas vezes)
      setData(d => ({ ...d, [listKey]: d[listKey].map(x => x.id === form.id ? { ...form, total } : x) }));
      setModal(null);
      return;
    }
    setData(d => ({ ...d, [listKey]: [{ ...form, total, id: uid() }, ...d[listKey]] }));
    if (updateStock && form.type === "compra" && form.name) {
      setData(d => {
        const idx = d.stockItems.findIndex(s => s.name.toLowerCase() === form.name.toLowerCase());
        if (idx >= 0) { const u = [...d.stockItems]; u[idx] = { ...u[idx], qty: Number(u[idx].qty) + Number(form.qty) }; return { ...d, stockItems: u }; }
        return { ...d, stockItems: [{ id: uid(), name: form.name, category: "insumo", unit: form.unit, qty: form.qty, minQty: 0 }, ...d.stockItems] };
      });
    }
    setModal(null);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text }}>{title}</h2>
        <Btn onClick={openNew}><Icon name="plus" size={16} color="#fff" /> Novo Lançamento</Btn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["compra", "venda"].map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: `2px solid ${tab === t ? C.primary : C.border}`, background: tab === t ? C.primary : "transparent", color: tab === t ? "#fff" : C.muted, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      <Card>
        <Table cols={[
          { key: "date", label: "Data", render: r => fmtDate(r.date) },
          { key: "name", label: itemLabel },
          { key: "tipo", label: "Tipo" },
          { key: "description", label: "Descrição" },
          { key: "counter", label: tab === "compra" ? "Fornecedor / Loja" : "Comprador" },
          { key: "qty", label: "Qtd", render: r => { const bi = baseInfo(r); return bi && bi.pack ? `${r.qty} ${r.unit} (${fmt(bi.totalBase, 0)} ${bi.base})` : `${r.qty} ${r.unit}`; } },
          { key: "unitPrice", label: "Preço", render: r => { const bi = baseInfo(r); return <span>{fmtMoney(r.unitPrice)}{bi ? <span style={{ color: C.muted, fontSize: 11, display: "block" }}>{fmtMoney(bi.porBase)}/{bi.base}</span> : null}</span>; } },
          { key: "total", label: "Total", render: r => <strong>{fmtMoney(r.total)}</strong> },
          { key: "nf", label: "NF" },
          { key: "acoes", label: "", render: r => <RowActions onEdit={() => openEdit(r)} onCopy={() => openCopy(r)} onDelete={() => setData(d => ({ ...d, [listKey]: d[listKey].filter(x => x.id !== r.id) }))} /> },
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
        <Modal title={`${modal === "edit" ? "Editar" : modal === "copy" ? "Copiar" : (form.type === "compra" ? "Compra" : "Venda")} — ${title}`} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <Input label={itemLabel} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} suggestions={nomesItens} required />
            <Input label="Tipo (defensivo / adubo)" value={form.tipo} onChange={v => setForm(f => ({ ...f, tipo: v }))} suggestions={tipos} placeholder="Ex.: inseticida, adubo foliar, fungicida..." />
            <Input label="Descrição" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
            <Input label={rotuloContraparte} value={form.counter} onChange={v => setForm(f => ({ ...f, counter: v }))} suggestions={nomesContraparte} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Input label="Qtd" type="number" value={form.qty} onChange={v => setForm(f => ({ ...f, qty: v }))} />
              <Select label="Unidade" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v, packSize: v === "sc" ? (f.packSize || 50) : v === "bombona" ? (f.packSize || 20) : "" }))} options={unidadeOpcoes} />
              <Input label={form.unit === "sc" ? "Preço por saco" : form.unit === "bombona" ? "Preço por emb." : "Preço unit."} type="number" value={form.unitPrice} onChange={v => setForm(f => ({ ...f, unitPrice: v }))} />
            </div>
            {PACK_CFG[form.unit] && (() => {
              const cfg = PACK_CFG[form.unit];
              const preset = cfg.opcoes.map(String).includes(String(form.packSize)) ? String(form.packSize) : "outro";
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Select label={cfg.rotulo} value={preset} onChange={v => setForm(f => ({ ...f, packSize: v === "outro" ? "" : Number(v) }))} options={[...cfg.opcoes.map(o => ({ value: String(o), label: `${o} ${cfg.base}` })), { value: "outro", label: "Outro" }]} />
                  {preset === "outro" && <Input label={cfg.rotulo} type="number" value={form.packSize} onChange={v => setForm(f => ({ ...f, packSize: v }))} />}
                </div>
              );
            })()}
            {(() => {
              const info = baseInfo(form);
              if (!info) return null;
              return (
                <div style={{ background: C.green50, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.textSoft }}>
                  {info.pack && Number(form.qty) > 0 && <>{fmt(Number(form.qty), 0)} × {form.packSize} {info.base} = <strong>{fmt(info.totalBase, 0)} {info.base}</strong> — </>}
                  valor por {info.base}: <strong style={{ color: C.primary }}>{fmtMoney(info.porBase)}</strong>
                </div>
              );
            })()}
            <Input label="Nota Fiscal" value={form.nf} onChange={v => setForm(f => ({ ...f, nf: v }))} />
            <div style={{ textAlign: "right", fontWeight: 700, color: C.primary }}>Total: {fmtMoney(Number(form.qty) * Number(form.unitPrice))}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
