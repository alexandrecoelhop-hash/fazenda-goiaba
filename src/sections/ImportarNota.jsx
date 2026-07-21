import { useState, useRef } from "react";
import { C } from "../ui/theme";
import { uid, today, fmt, fmtMoney } from "../lib/format";
import { lerNota } from "../lib/nota";
import { nomesUsados } from "../lib/registros";
import { Card, Btn, Badge, Icon, Input, Select } from "../ui";

// ─── Importar nota fiscal (PDF/XML) → conferência item a item → estoque ──────
const DESTINOS = [
  { value: "estoque_compra", label: "Estoque + compra" },
  { value: "estoque", label: "Só estoque" },
  { value: "fora", label: "Não é meu" },
];

export default function ImportarNota({ data, setData }) {
  const [nota, setNota] = useState(null);
  const [erro, setErro] = useState("");
  const [lendo, setLendo] = useState(false);
  const [loja, setLoja] = useState("");
  const [dataNota, setDataNota] = useState(today());
  const fileRef = useRef();

  const lojasConhecidas = nomesUsados(data.inputPurchases, "counter");

  const abrir = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErro(""); setLendo(true); setNota(null);
    try {
      const lida = await lerNota(file);
      setNota({ ...lida, itens: lida.itens.map(i => ({ ...i, destino: "estoque_compra", categoria: "insumo" })) });
      setLoja(lida.loja || "");
      setDataNota(lida.data || today());
    } catch (err) {
      setErro(err.message || "Não consegui ler este arquivo.");
    }
    setLendo(false);
    e.target.value = "";
  };

  const mudarItem = (id, campo, valor) => setNota(n => ({ ...n, itens: n.itens.map(i => i.id === id ? { ...i, [campo]: valor } : i) }));
  const marcarTodos = (destino) => setNota(n => ({ ...n, itens: n.itens.map(i => ({ ...i, destino })) }));

  const meus = nota ? nota.itens.filter(i => i.destino !== "fora") : [];
  const totalMeu = meus.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalNota = nota ? nota.itens.reduce((s, i) => s + Number(i.total || 0), 0) : 0;

  const importar = () => {
    if (!meus.length) return;
    setData(d => {
      let stockItems = [...d.stockItems];
      const compras = [];
      meus.forEach(i => {
        const idx = stockItems.findIndex(s => s.name.trim().toLowerCase() === i.nome.trim().toLowerCase());
        if (idx >= 0) stockItems[idx] = { ...stockItems[idx], qty: Number(stockItems[idx].qty || 0) + Number(i.qtd) };
        else stockItems = [{ id: uid(), name: i.nome, category: i.categoria, unit: i.unidade, qty: i.qtd, minQty: 0 }, ...stockItems];
        if (i.destino === "estoque_compra") {
          compras.push({ id: uid(), type: "compra", date: dataNota, name: i.nome, description: nota.numero ? `NF ${nota.numero}` : "", counter: loja, qty: i.qtd, unit: i.unidade, unitPrice: i.valorUnit, total: i.total, nf: nota.numero || "" });
        }
      });
      return { ...d, stockItems, inputPurchases: [...compras, ...d.inputPurchases] };
    });
    const nCompras = meus.filter(i => i.destino === "estoque_compra").length;
    alert(`${meus.length} item(ns) no estoque${nCompras ? ` e ${nCompras} compra(s) lançada(s) em Insumos` : ""}.`);
    setNota(null);
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 8px", color: C.text }}>Importar Nota Fiscal</h2>
      <p style={{ color: C.muted, fontSize: 13, marginTop: 0, marginBottom: 20 }}>
        Envie o <strong>PDF</strong> ou o <strong>XML</strong> da nota. O app lê os produtos e você confere item a item o que é seu antes de entrar no estoque.
        O arquivo é lido no próprio aparelho — não vai para a internet.
      </p>

      <Card style={{ marginBottom: 20 }}>
        <input ref={fileRef} type="file" accept=".pdf,.xml,application/pdf,text/xml" onChange={abrir} style={{ display: "none" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Btn onClick={() => fileRef.current.click()}><Icon name="excel" size={16} color="#fff" /> {lendo ? "Lendo…" : "Escolher nota (PDF ou XML)"}</Btn>
          {nota && <Badge color={C.primary}>{nota.origem}{nota.numero ? ` · NF ${nota.numero}` : ""}</Badge>}
        </div>
        {erro && <div style={{ background: C.dangerLight, color: "#7a2018", borderRadius: 9, padding: "10px 12px", fontSize: 13, marginTop: 12 }}>⚠ {erro}</div>}
      </Card>

      {nota && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <Input label="Loja / Fornecedor" value={loja} onChange={setLoja} suggestions={lojasConhecidas} />
              <Input label="Data da compra" type="date" value={dataNota} onChange={setDataNota} />
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <h4 style={{ margin: 0, color: C.text, fontSize: 15 }}>Conferência — o que é seu?</h4>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="ghost" onClick={() => marcarTodos("estoque_compra")}>Marcar tudo como meu</Btn>
                <Btn size="sm" variant="ghost" onClick={() => marcarTodos("fora")}>Desmarcar tudo</Btn>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
              Confira quantidades e valores antes de importar — a leitura automática pode errar em notas de layout diferente.
            </div>

            {nota.itens.map(i => {
              const fora = i.destino === "fora";
              return (
                <div key={i.id} style={{ border: `1px solid ${C.border}`, borderLeft: `4px solid ${fora ? C.border : C.primary}`, borderRadius: 10, padding: 12, marginBottom: 10, background: fora ? "#fafafa" : C.card, opacity: fora ? .6 : 1 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 8 }}>
                    <Input label="Produto" value={i.nome} onChange={v => mudarItem(i.id, "nome", v)} />
                    <Select label="Destino" value={i.destino} onChange={v => mudarItem(i.id, "destino", v)} options={DESTINOS} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                    <Input label="Qtd" type="number" value={i.qtd} onChange={v => mudarItem(i.id, "qtd", v)} />
                    <Input label="Unid" value={i.unidade} onChange={v => mudarItem(i.id, "unidade", v)} />
                    <Input label="Preço unit." type="number" value={i.valorUnit} onChange={v => mudarItem(i.id, "valorUnit", v)} />
                    <Select label="Categoria" value={i.categoria} onChange={v => mudarItem(i.id, "categoria", v)} options={["insumo", "defensivo", "material", "embalagem", "ferramenta", "outro"].map(c => ({ value: c, label: c }))} />
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13, color: C.textSoft, marginTop: 6 }}>
                    Total do item: <strong style={{ color: fora ? C.muted : C.primary }}>{fmtMoney(Number(i.qtd) * Number(i.valorUnit))}</strong>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 13, color: C.textSoft }}>
                <div>Nota inteira: <strong>{fmtMoney(totalNota)}</strong> · {nota.itens.length} item(ns)</div>
                <div style={{ color: C.primary, fontWeight: 700 }}>Seu: {fmtMoney(totalMeu)} · {meus.length} item(ns)</div>
                {nota.itens.length - meus.length > 0 && <div style={{ color: C.muted, fontSize: 12 }}>{nota.itens.length - meus.length} item(ns) de terceiros serão ignorados</div>}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="ghost" onClick={() => setNota(null)}>Cancelar</Btn>
                <Btn onClick={importar}><Icon name="check" size={16} color="#fff" /> Importar {meus.length} item(ns)</Btn>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
