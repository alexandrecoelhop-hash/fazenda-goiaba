import { useState } from "react";
import { C } from "../ui/theme";
import { uid } from "../lib/format";
import { listaSugestoes, UNIDADES_COMUNS } from "../lib/registros";
import { Card, Btn, Badge, Icon, Input, Select, Modal, Table, RowActions } from "../ui";

// ─── Stock ───────────────────────────────────────────────────────────────────
export default function Stock({ data, setData }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", category: "insumo", unit: "kg", qty: "", minQty: "" });
  const cats = ["insumo", "defensivo", "material", "embalagem", "ferramenta", "outro"];
  const nomes = listaSugestoes([], data.stockItems.map(s => s.name), data.inputPurchases.map(i => i.name));
  const unidades = listaSugestoes(UNIDADES_COMUNS, data.stockItems.map(s => s.unit));
  const save = () => {
    if (!form.name || !form.qty) return;
    if (modal === "edit") setData(d => ({ ...d, stockItems: d.stockItems.map(i => i.id === form.id ? form : i) }));
    else setData(d => ({ ...d, stockItems: [{ ...form, id: uid() }, ...d.stockItems] }));
    setModal(null);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text }}>Estoque</h2>
        <Btn onClick={() => { setForm({ name: "", category: "insumo", unit: "kg", qty: "", minQty: "" }); setModal("new"); }}><Icon name="plus" size={16} color="#fff" /> Novo Item</Btn>
      </div>
      <Card>
        <Table cols={[
          { key: "name", label: "Produto" },
          { key: "category", label: "Categoria", render: r => <Badge color={C.primary}>{r.category}</Badge> },
          { key: "qty", label: "Qtd", render: r => `${r.qty} ${r.unit}` },
          { key: "minQty", label: "Mín.", render: r => `${r.minQty || 0} ${r.unit}` },
          { key: "status", label: "Status", render: r => Number(r.qty) <= Number(r.minQty || 0) ? <Badge color={C.danger}>Baixo</Badge> : <Badge color={C.primaryLight}>OK</Badge> },
          { key: "a", label: "", render: r => <RowActions onEdit={() => { setForm(r); setModal("edit"); }} onCopy={() => { const { id, ...rest } = r; setForm(rest); setModal("copy"); }} onDelete={() => setData(d => ({ ...d, stockItems: d.stockItems.filter(i => i.id !== r.id) }))} /> },
        ]} rows={data.stockItems} />
      </Card>
      {modal && (
        <Modal title={modal === "edit" ? "Editar Item" : modal === "copy" ? "Copiar Item" : "Novo Item"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Nome" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} suggestions={nomes} required />
            <Select label="Categoria" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={cats.map(c => ({ value: c, label: c }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Input label="Qtd" type="number" value={form.qty} onChange={v => setForm(f => ({ ...f, qty: v }))} required />
              <Input label="Unidade" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} suggestions={unidades} />
              <Input label="Mínimo" type="number" value={form.minQty} onChange={v => setForm(f => ({ ...f, minQty: v }))} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
