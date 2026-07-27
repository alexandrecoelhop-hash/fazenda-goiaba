import { useState, useRef } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { C } from "../ui/theme";
import { uid, today, fmt, fmtMoney } from "../lib/format";
import { lerNota, lerImagemNota } from "../lib/nota";
import { nomesUsados } from "../lib/registros";
import { Card, Btn, Badge, Icon, Input, Select } from "../ui";

// ─── Importar nota fiscal (PDF/XML/foto) → conferência item a item → estoque ─
const DESTINOS = [
  { value: "estoque_compra", label: "Estoque + compra" },
  { value: "estoque", label: "Só estoque" },
  { value: "fora", label: "Não é meu" },
];

// Carrega uma imagem (de uma URL) já pronta para desenhar em canvas
const carregarImagem = (src) => new Promise((res, rej) => {
  const im = new Image();
  im.onload = () => res(im);
  im.onerror = () => rej(new Error("Não consegui abrir a imagem."));
  im.src = src;
});

// Gira a foto 90° (para notas fotografadas deitadas) → devolve novo blob
async function rotacionar90(url) {
  const img = await carregarImagem(url);
  const cv = document.createElement("canvas");
  cv.width = img.naturalHeight;
  cv.height = img.naturalWidth;
  const ctx = cv.getContext("2d");
  ctx.translate(cv.width / 2, cv.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return await new Promise(r => cv.toBlob(r, "image/jpeg", 0.92));
}

// Recorta a região selecionada (crop em px relativos ao tamanho exibido) → blob
async function recortarBlob(imgEl, crop) {
  const usar = crop && crop.width > 4 && crop.height > 4;
  const escalaX = imgEl.naturalWidth / imgEl.width;
  const escalaY = imgEl.naturalHeight / imgEl.height;
  const sx = usar ? crop.x * escalaX : 0;
  const sy = usar ? crop.y * escalaY : 0;
  const sw = usar ? crop.width * escalaX : imgEl.naturalWidth;
  const sh = usar ? crop.height * escalaY : imgEl.naturalHeight;
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.round(sw));
  cv.height = Math.max(1, Math.round(sh));
  cv.getContext("2d").drawImage(imgEl, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
  return await new Promise(r => cv.toBlob(r, "image/jpeg", 0.95));
}

export default function ImportarNota({ data, setData }) {
  const [nota, setNota] = useState(null);
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState(null);
  const [lendo, setLendo] = useState(false);
  const [progresso, setProgresso] = useState(null); // % do OCR da foto
  const [fotoUrl, setFotoUrl] = useState(null);      // foto escolhida, aguardando recorte
  const [crop, setCrop] = useState();                // seleção de recorte
  const [loja, setLoja] = useState("");
  const [dataNota, setDataNota] = useState(today());
  const fileRef = useRef();
  const cameraRef = useRef();
  const galeriaRef = useRef();
  const imgRef = useRef();

  const lojasConhecidas = nomesUsados(data.inputPurchases, "counter");

  const abrir = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErro(""); setFeito(null); setLendo(true); setNota(null);
    try {
      const lida = await lerNota(file);
      setNota({ ...lida, itens: lida.itens.map(i => ({ ...i, destino: "estoque_compra", categoria: "insumo" })) });
      setLoja(lida.loja || "");
      setDataNota(lida.data || today());
    } catch (err) {
      setErro(err.message || "Não consegui ler este arquivo.");
    }
    setLendo(false);
  };

  // Escolheu uma foto (câmera ou galeria): mostra para recortar antes de ler
  const escolherFoto = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErro(""); setFeito(null); setNota(null); setCrop(undefined);
    if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    setFotoUrl(URL.createObjectURL(file));
  };

  const girarFoto = async () => {
    if (!fotoUrl || lendo) return;
    try {
      const b = await rotacionar90(fotoUrl);
      URL.revokeObjectURL(fotoUrl);
      setFotoUrl(URL.createObjectURL(b));
      setCrop(undefined);
    } catch (err) { setErro(err.message || "Não consegui girar a foto."); }
  };

  const cancelarFoto = () => {
    if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    setFotoUrl(null); setCrop(undefined);
  };

  const lerRecorte = async () => {
    if (!imgRef.current || lendo) return;
    setErro(""); setFeito(null); setLendo(true); setProgresso(0);
    try {
      const blob = await recortarBlob(imgRef.current, crop);
      const lida = await lerImagemNota(blob, (pct) => setProgresso(pct));
      setNota({ ...lida, itens: lida.itens.map(i => ({ ...i, destino: "estoque_compra", categoria: "insumo" })) });
      setLoja(lida.loja || "");
      setDataNota(lida.data || today());
      if (fotoUrl) URL.revokeObjectURL(fotoUrl);
      setFotoUrl(null); setCrop(undefined);
    } catch (err) {
      setErro(err.message || "Não consegui ler a foto.");
    }
    setLendo(false); setProgresso(null);
  };

  const mudarItem = (id, campo, valor) => setNota(n => ({ ...n, itens: n.itens.map(i => i.id === id ? { ...i, [campo]: valor } : i) }));
  const marcarTodos = (destino) => setNota(n => ({ ...n, itens: n.itens.map(i => ({ ...i, destino })) }));

  const totalItem = (i) => Number(i.qtd || 0) * Number(i.valorUnit || 0);
  const adicionarItem = () => setNota(n => ({ ...n, itens: [...n.itens, { id: uid(), nome: "", unidade: "un", qtd: 1, valorUnit: 0, destino: "estoque_compra", categoria: "insumo" }] }));
  const removerItem = (id) => setNota(n => ({ ...n, itens: n.itens.filter(x => x.id !== id) }));

  const meus = nota ? nota.itens.filter(i => i.destino !== "fora") : [];
  const totalMeu = meus.reduce((s, i) => s + totalItem(i), 0);
  const totalNota = nota ? nota.itens.reduce((s, i) => s + totalItem(i), 0) : 0;

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
          compras.push({ id: uid(), type: "compra", date: dataNota, name: i.nome, description: nota.numero ? `NF ${nota.numero}` : "", counter: loja, qty: i.qtd, unit: i.unidade, unitPrice: i.valorUnit, total: totalItem(i), nf: nota.numero || "" });
        }
      });
      return { ...d, stockItems, inputPurchases: [...compras, ...d.inputPurchases] };
    });
    const nCompras = meus.filter(i => i.destino === "estoque_compra").length;
    setFeito({ itens: meus.length, compras: nCompras, valor: totalMeu, produtos: meus.map(i => i.nome) });
    setNota(null);
  };

  const barraProgresso = lendo && progresso != null && (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 6 }}>{progresso === 0 ? "Preparando o leitor de foto…" : `Lendo a foto no aparelho… ${progresso}%`}</div>
      <div style={{ background: C.border, borderRadius: 999, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(progresso, 4)}%`, height: "100%", background: C.primary, transition: "width .2s" }} />
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ margin: "0 0 8px", color: C.text }}>Importar Nota Fiscal</h2>
      <p style={{ color: C.muted, fontSize: 13, marginTop: 0, marginBottom: 20 }}>
        Envie o <strong>XML</strong> (leitura exata), o <strong>PDF</strong>, ou uma <strong>foto</strong> da nota (câmera ou galeria). O app lê os produtos e você confere item a item o que é seu antes de entrar no estoque.
        As notas são lidas no próprio aparelho — não vão para a internet. Na foto, <strong>recorte só a lista de produtos</strong> para acertar mais.
      </p>

      <Card style={{ marginBottom: 20 }}>
        <input ref={fileRef} type="file" accept=".pdf,.xml,application/pdf,text/xml" onChange={abrir} style={{ display: "none" }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={escolherFoto} style={{ display: "none" }} />
        <input ref={galeriaRef} type="file" accept="image/*" onChange={escolherFoto} style={{ display: "none" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Btn onClick={() => fileRef.current.click()}><Icon name="excel" size={16} color="#fff" /> {lendo && progresso == null ? "Lendo…" : "Escolher nota (PDF ou XML)"}</Btn>
          <Btn variant="ghost" onClick={() => cameraRef.current.click()}><Icon name="camera" size={16} color={C.primary} /> Tirar foto da nota</Btn>
          <Btn variant="ghost" onClick={() => galeriaRef.current.click()}>🖼️ Escolher foto (galeria)</Btn>
          {nota && <Badge color={C.primary}>{nota.origem}{nota.numero ? ` · NF ${nota.numero}` : ""}</Badge>}
        </div>
        {!fotoUrl && barraProgresso}
        {erro && <div style={{ background: C.dangerLight, color: "#7a2018", borderRadius: 9, padding: "10px 12px", fontSize: 13, marginTop: 12 }}>⚠ {erro}</div>}
      </Card>

      {fotoUrl && !nota && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 10 }}>
            Arraste sobre a foto para selecionar <strong>só a lista de produtos</strong> (com quantidade e valores). Depois toque em <strong>Ler produtos</strong>. Se a foto estiver deitada, use <strong>Girar</strong>.
          </div>
          <div style={{ display: "inline-block", maxWidth: "100%", background: "#000", borderRadius: 8, overflow: "hidden" }}>
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
              <img ref={imgRef} src={fotoUrl} alt="foto da nota" style={{ display: "block", maxWidth: "100%", maxHeight: "60vh" }} />
            </ReactCrop>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            <Btn onClick={lerRecorte}><Icon name="check" size={16} color="#fff" /> {lendo ? "Lendo…" : "Ler produtos"}</Btn>
            <Btn variant="ghost" onClick={girarFoto}>↻ Girar</Btn>
            <Btn variant="ghost" onClick={() => (crop ? setCrop(undefined) : null)}>Limpar seleção</Btn>
            <Btn variant="ghost" onClick={cancelarFoto}>Cancelar</Btn>
          </div>
          {barraProgresso}
        </Card>
      )}

      {feito && (
        <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.primaryLight}`, background: C.green50 }}>
          <div style={{ fontWeight: 700, color: C.primary, marginBottom: 6 }}>✓ Importado com sucesso</div>
          <div style={{ fontSize: 13, color: C.textSoft }}>
            {feito.itens} item(ns) somados ao <strong>Estoque</strong>
            {feito.compras > 0 && <> e {feito.compras} compra(s) de {fmtMoney(feito.valor)} lançada(s) em <strong>Insumos</strong></>}.
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{feito.produtos.join(" · ")}</div>
        </Card>
      )}

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
            <div style={{ background: C.green50, borderRadius: 8, padding: "10px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontSize: 13, color: C.textSoft }}>Depois de conferir, clique aqui para gravar no estoque:</span>
              <Btn onClick={importar}><Icon name="check" size={16} color="#fff" /> Importar {meus.length} item(ns)</Btn>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <button onClick={() => removerItem(i.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: 0 }}>Remover</button>
                    <span style={{ fontSize: 13, color: C.textSoft }}>Total do item: <strong style={{ color: fora ? C.muted : C.primary }}>{fmtMoney(totalItem(i))}</strong></span>
                  </div>
                </div>
              );
            })}
            <Btn variant="ghost" onClick={adicionarItem} style={{ marginTop: 4 }}><Icon name="plus" size={14} color={C.primary} /> Adicionar item</Btn>
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
