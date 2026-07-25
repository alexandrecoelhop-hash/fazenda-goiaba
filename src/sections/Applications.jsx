import { useState } from "react";
import { C } from "../ui/theme";
import { uid, today, fmtDate } from "../lib/format";
import { PEST_DB } from "../data/pests";
import { Card, Btn, Badge, Icon, Input, Modal, Table, RowActions } from "../ui";

// ─── APLICAÇÕES (caderno de campo fitossanitário) ────────────────────────────
const EMPTY = { date: "", talhao: "", target: "", product: "", active: "", dose: "", volume: "", carencia: "", reentry: "", applicator: "", notes: "" };

export default function Applications({ data, setData }) {
  const [modal, setModal] = useState(null); // null | "new" | "edit" | "copy"
  const [form, setForm] = useState(EMPTY);
  const openNew = () => { setForm({ ...EMPTY, date: today() }); setModal("new"); };
  const openEdit = (r) => { setForm({ ...EMPTY, ...r }); setModal("edit"); };
  const openCopy = (r) => { const { id, ...rest } = r; setForm({ ...EMPTY, ...rest, date: today() }); setModal("copy"); };
  const save = () => {
    if (modal === "edit") setData(d => ({ ...d, applications: d.applications.map(x => x.id === form.id ? { ...form } : x) }));
    else setData(d => ({ ...d, applications: [{ ...form, id: uid() }, ...d.applications] }));
    setModal(null);
  };
  const applyDbSuggestion = (pestName) => { const p = PEST_DB.find(x => x.nome === pestName); if (p) setForm(f => ({ ...f, target: p.nome, product: p.exemplos[0] || "", active: "" })); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text }}>Caderno de Aplicações</h2>
        <Btn onClick={openNew}><Icon name="plus" size={16} color="#fff" /> Nova Aplicação</Btn>
      </div>
      <Card>
        <Table cols={[
          { key: "date", label: "Data", render: r => fmtDate(r.date) },
          { key: "talhao", label: "Talhão" },
          { key: "target", label: "Alvo" },
          { key: "product", label: "Produto (i.a.)", render: r => <span>{r.product}{r.active ? ` (${r.active})` : ""}</span> },
          { key: "dose", label: "Dose" },
          { key: "volume", label: "Volume calda" },
          { key: "carencia", label: "Carência", render: r => r.carencia ? <Badge color={C.danger}>{r.carencia} d</Badge> : "-" },
          { key: "applicator", label: "Responsável" },
          { key: "acoes", label: "", render: r => <RowActions onEdit={() => openEdit(r)} onCopy={() => openCopy(r)} onDelete={() => setData(d => ({ ...d, applications: d.applications.filter(x => x.id !== r.id) }))} /> },
        ]} rows={data.applications} />
      </Card>
      {modal && (
        <Modal title={modal === "edit" ? "Editar Aplicação" : modal === "copy" ? "Copiar Aplicação" : "Registro de Aplicação"} onClose={() => setModal(null)} wide>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft }}>Sugestão rápida por alvo</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {PEST_DB.map(p => <button key={p.id} onClick={() => applyDbSuggestion(p.nome)} style={{ background: C.green100, border: "none", borderRadius: 16, padding: "3px 10px", fontSize: 11, color: C.primary, cursor: "pointer", fontFamily: "inherit" }}>{p.nome}</button>)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <Input label="Talhão / Bloco" value={form.talhao} onChange={v => setForm(f => ({ ...f, talhao: v }))} />
            <Input label="Alvo (praga/doença)" value={form.target} onChange={v => setForm(f => ({ ...f, target: v }))} />
            <Input label="Produto comercial" value={form.product} onChange={v => setForm(f => ({ ...f, product: v }))} />
            <Input label="Ingrediente ativo" value={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} />
            <Input label="Dose (ex: 100 mL/100L)" value={form.dose} onChange={v => setForm(f => ({ ...f, dose: v }))} />
            <Input label="Volume de calda (L/ha)" value={form.volume} onChange={v => setForm(f => ({ ...f, volume: v }))} />
            <Input label="Carência (dias)" type="number" value={form.carencia} onChange={v => setForm(f => ({ ...f, carencia: v }))} />
            <Input label="Reentrada (horas)" type="number" value={form.reentry} onChange={v => setForm(f => ({ ...f, reentry: v }))} />
            <Input label="Responsável / aplicador" value={form.applicator} onChange={v => setForm(f => ({ ...f, applicator: v }))} />
          </div>
          <Input label="Observações (clima, equipamento, EPI)" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} style={{ marginTop: 12 }} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}><Icon name="check" size={16} color="#fff" /> Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
