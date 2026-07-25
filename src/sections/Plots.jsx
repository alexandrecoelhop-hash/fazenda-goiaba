import { useState } from "react";
import { C } from "../ui/theme";
import { uid } from "../lib/format";
import { Card, Btn, Badge, Icon, Input, Select, Modal } from "../ui";

// ─── Plots ───────────────────────────────────────────────────────────────────
const EMPTY = { name: "", variety: "", area: "", plantYear: "", plantCount: "", irrigation: "gotejamento", stage: "produção", notes: "" };

export default function Plots({ data, setData }) {
  const [modal, setModal] = useState(null); // null | "new" | "edit" | "copy"
  const [form, setForm] = useState(EMPTY);
  const stages = ["viveiro", "implantação", "formação", "produção", "renovação"];
  const irr = ["gotejamento", "microaspersão", "aspersão convencional", "sulcos", "sem irrigação"];
  const openNew = () => { setForm(EMPTY); setModal("new"); };
  const openEdit = (p) => { setForm({ ...EMPTY, ...p }); setModal("edit"); };
  const openCopy = (p) => { const { id, ...rest } = p; setForm({ ...EMPTY, ...rest, name: `${p.name} (cópia)` }); setModal("copy"); };
  const save = () => {
    if (modal === "edit") setData(d => ({ ...d, plots: d.plots.map(x => x.id === form.id ? { ...form } : x) }));
    else setData(d => ({ ...d, plots: [{ ...form, id: uid() }, ...d.plots] }));
    setModal(null);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0, color: C.text }}>Talhões / Blocos</h2><Btn onClick={openNew}><Icon name="plus" size={16} color="#fff" /> Novo Talhão</Btn></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {data.plots.length === 0 && <p style={{ color: C.muted }}>Nenhum talhão cadastrado.</p>}
        {data.plots.map(p => (
          <Card key={p.id} style={{ borderLeft: `4px solid ${C.primary}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div><div style={{ color: C.muted, fontSize: 13 }}>Var.: {p.variety}</div></div><Badge color={C.primary}>{p.stage}</Badge></div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13 }}>
              <div><span style={{ color: C.muted }}>Área:</span> <strong>{p.area} ha</strong></div><div><span style={{ color: C.muted }}>Plantas:</span> <strong>{p.plantCount}</strong></div>
              <div><span style={{ color: C.muted }}>Plantio:</span> <strong>{p.plantYear}</strong></div><div><span style={{ color: C.muted }}>Irrig.:</span> <strong>{p.irrigation}</strong></div>
            </div>
            {p.notes && <div style={{ marginTop: 10, fontSize: 12, color: C.muted, background: C.green50, borderRadius: 6, padding: "6px 10px" }}>{p.notes}</div>}
            <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>Editar</Btn>
              <Btn size="sm" variant="ghost" onClick={() => openCopy(p)}>Copiar</Btn>
              <Btn size="sm" variant="danger" onClick={() => setData(d => ({ ...d, plots: d.plots.filter(x => x.id !== p.id) }))}><Icon name="trash" size={14} color="#fff" /> Remover</Btn>
            </div>
          </Card>
        ))}
      </div>
      {modal && <Modal title={modal === "edit" ? "Editar Talhão" : modal === "copy" ? "Copiar Talhão" : "Cadastrar Talhão"} onClose={() => setModal(null)}><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><Input label="Nome/Código" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required /><Input label="Variedade" value={form.variety} onChange={v => setForm(f => ({ ...f, variety: v }))} placeholder="Paluma, Pedro Sato..." /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}><Input label="Área (ha)" type="number" value={form.area} onChange={v => setForm(f => ({ ...f, area: v }))} /><Input label="Nº plantas" type="number" value={form.plantCount} onChange={v => setForm(f => ({ ...f, plantCount: v }))} /><Input label="Ano plantio" type="number" value={form.plantYear} onChange={v => setForm(f => ({ ...f, plantYear: v }))} /></div>
        <Select label="Irrigação" value={form.irrigation} onChange={v => setForm(f => ({ ...f, irrigation: v }))} options={irr.map(i => ({ value: i, label: i }))} />
        <Select label="Estágio" value={form.stage} onChange={v => setForm(f => ({ ...f, stage: v }))} options={stages.map(s => ({ value: s, label: s }))} />
        <Input label="Obs" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn></div>
      </div></Modal>}
    </div>
  );
}
