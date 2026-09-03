import { useState } from "react";
import { C } from "../ui/theme";
import { uid, fmt, fmtMoney } from "../lib/format";
import { CAIXA_KG } from "../lib/sales";
import { nomesUsados, listaSugestoes, TIPOS_PRODUTO } from "../lib/registros";
import { interpretarFala, trocarDestino, totalDe, destinoInfo, DESTINOS, EXEMPLOS } from "../lib/voz";
import { useFala } from "../lib/useFala";
import { Card, Btn, Icon, Input, Select, Badge } from "../ui";

// ─── Lançar por voz ──────────────────────────────────────────────────────────
// Fala → texto (no próprio aparelho) → lançamento interpretado → conferência →
// salvo na mesma base do app (e, portanto, no Financeiro e no Excel).
const TIPOS_FRUTA = [
  { value: "verde", label: "Goiaba Verde" }, { value: "polpa", label: "Polpa" },
  { value: "madura", label: "Goiaba Madura" }, { value: "refugo", label: "Refugo" },
];
const UNID_COMPRA = [
  { value: "kg", label: "Kg" }, { value: "sc", label: "Saco" }, { value: "L", label: "Litro" },
  { value: "bombona", label: "Bombona / Galão" }, { value: "un", label: "Unidade" },
  { value: "m", label: "Metro" }, { value: "t", label: "Tonelada" }, { value: "ml", label: "mL" },
];
const opcoesCom = (base, valor) =>
  valor && !base.some(o => o.value === valor) ? [...base, { value: valor, label: valor }] : base;

export default function LancarVoz({ data, setData, onNavigate }) {
  const [interp, setInterp] = useState(null);
  const [digitado, setDigitado] = useState("");
  const [feito, setFeito] = useState(null);
  const [aviso, setAviso] = useState("");

  const interpretar = (texto) => {
    if (!texto || !texto.trim()) return;
    setFeito(null);
    setAviso("");
    setInterp(interpretarFala(texto));
  };
  const { ouvindo, parcial, erro, ouvir, suportado } = useFala(interpretar);

  const campos = interp ? interp.campos : {};
  const setCampo = (k, v) => setInterp(i => ({ ...i, campos: { ...i.campos, [k]: v } }));
  const total = interp ? totalDe(interp) : 0;
  // Editar o total reparte o valor pela quantidade (mantém total = qtd × preço)
  const setTotal = (v) => {
    const t = Number(String(v).replace(",", ".")) || 0;
    if (interp.destino === "energia") return setCampo("value", t);
    if (interp.destino === "maodeobra") {
      const dias = Number(campos.days) || 1;
      return setInterp(i => ({ ...i, campos: { ...i.campos, days: dias, dailyRate: t / dias } }));
    }
    const q = Number(campos.qty) || 1;
    setInterp(i => ({ ...i, campos: { ...i.campos, qty: q, unitPrice: t / q } }));
  };

  const salvar = () => {
    const c = interp.campos;
    const info = destinoInfo(interp.destino);
    if (interp.destino === "energia") {
      if (!(Number(c.value) > 0)) return setAviso("Informe o valor da conta.");
      setData(d => ({ ...d, energyBills: [{ ...c, id: uid() }, ...d.energyBills] }));
    } else if (interp.destino === "maodeobra") {
      if (!(Number(c.days) > 0 && Number(c.dailyRate) > 0)) return setAviso("Informe os dias e o valor.");
      if (!c.worker) return setAviso("Informe quem recebeu.");
      const reg = { ...c, total: Number(c.days) * Number(c.dailyRate) };
      setData(d => ({ ...d, laborEntries: [{ ...reg, id: uid() }, ...d.laborEntries] }));
    } else if (interp.destino === "venda") {
      if (!(Number(c.qty) > 0 && Number(c.unitPrice) > 0)) return setAviso("Informe a quantidade e o preço.");
      const reg = { ...c, entregador: c.local === "cidade" ? c.entregador : "", total: Number(c.qty) * Number(c.unitPrice) };
      setData(d => ({ ...d, fruitSales: [{ ...reg, id: uid() }, ...d.fruitSales] }));
    } else {
      if (!c.name) return setAviso("Informe o que foi comprado.");
      if (!(Number(c.qty) > 0 && Number(c.unitPrice) > 0)) return setAviso("Informe a quantidade e o valor.");
      const reg = { ...c, total: Number(c.qty) * Number(c.unitPrice) };
      setData(d => ({ ...d, [info.lista]: [{ ...reg, id: uid() }, ...d[info.lista]] }));
      // Compra de insumo também entra no estoque, como no lançamento manual
      if (interp.destino === "insumos") {
        setData(d => {
          const i = d.stockItems.findIndex(s => (s.name || "").toLowerCase() === c.name.toLowerCase());
          if (i >= 0) {
            const u = [...d.stockItems];
            u[i] = { ...u[i], qty: Number(u[i].qty || 0) + Number(c.qty || 0) };
            return { ...d, stockItems: u };
          }
          return { ...d, stockItems: [{ id: uid(), name: c.name, category: "insumo", unit: c.unit, qty: c.qty, minQty: 0 }, ...d.stockItems] };
        });
      }
    }
    setFeito({ destino: interp.destino, label: info.label, pagina: PAGINA[interp.destino], total: totalDe(interp), resumo: resumoCurto(interp) });
    setInterp(null);
    setDigitado("");
    setAviso("");
  };

  const nomesLoja = nomesUsados(data.inputPurchases, "counter").concat(nomesUsados(data.materialTransactions, "counter"));
  const nomesProduto = nomesUsados(data.inputPurchases, "name").concat(nomesUsados(data.materialTransactions, "name"));
  const nomesTrabalhador = nomesUsados(data.laborEntries, "worker");
  const nomesComprador = nomesUsados(data.fruitSales, "buyer");
  const tipos = listaSugestoes(TIPOS_PRODUTO, data.inputPurchases.map(x => x.tipo), data.materialTransactions.map(x => x.tipo));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ margin: 0, color: C.text }}>Lançar por Voz</h2>

      {/* ─── Microfone ─────────────────────────────────────────────────── */}
      <Card style={{ textAlign: "center", padding: 20 }}>
        <button onClick={ouvir} aria-label={ouvindo ? "Parar de ouvir" : "Falar o gasto"}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: "20px 16px", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: 17, fontWeight: 800, color: "#fff",
            background: ouvindo ? C.danger : C.primary,
            boxShadow: ouvindo ? `0 0 0 6px ${C.danger}22` : "none", transition: "background .2s",
          }}>
          <Icon name="mic" size={26} color="#fff" />
          {ouvindo ? "Ouvindo… toque para parar" : "Falar o gasto"}
        </button>
        <p style={{ margin: "12px 0 0", fontSize: 13, color: C.muted }}>
          {ouvindo
            ? "Fale naturalmente. Quando você parar de falar, o app entende sozinho."
            : "Toque, fale uma frase como “comprei 3 sacos de ureia na Agro Rural por 180 reais cada” e confira antes de salvar."}
        </p>
        {(parcial || ouvindo) && (
          <div style={{ marginTop: 12, background: C.green50, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, textAlign: "left", minHeight: 22 }}>
            {parcial || <span style={{ color: C.muted }}>…</span>}
          </div>
        )}
        {erro && (
          <div style={{ marginTop: 12, background: C.dangerLight, color: "#7a2018", borderRadius: 10, padding: "10px 14px", fontSize: 13, textAlign: "left" }}>{erro}</div>
        )}
        {!suportado && (
          <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
            Dica: no campo abaixo dá para usar o microfone do próprio teclado do celular.
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "flex-end" }}>
          <Input label="Ou escreva/dite a frase aqui" value={digitado} onChange={setDigitado}
            placeholder="paguei 2 diárias de 150 reais para o João" style={{ flex: 1 }} />
          <Btn variant="ghost" onClick={() => interpretar(digitado)}>Interpretar</Btn>
        </div>
      </Card>

      {/* ─── Confirmação do que foi salvo ──────────────────────────────── */}
      {feito && (
        <Card style={{ background: C.green50, borderColor: C.primaryLight }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Icon name="check" size={20} color={C.primary} />
            <strong style={{ color: C.primary }}>Lançado em {feito.label}</strong>
            <Badge color={C.primary}>{fmtMoney(feito.total)}</Badge>
          </div>
          <div style={{ fontSize: 13, color: C.textSoft, marginTop: 6 }}>{feito.resumo}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
            Já entrou no Financeiro, sincroniza sozinho na nuvem e sai na planilha em “Exportar Excel”.
          </div>
          {onNavigate && (
            <div style={{ marginTop: 12 }}>
              <Btn size="sm" variant="ghost" onClick={() => onNavigate(feito.pagina)}>Ver em {feito.label}</Btn>
            </div>
          )}
        </Card>
      )}

      {/* ─── Conferência antes de salvar ───────────────────────────────── */}
      {interp && (
        <Card>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Você disse</div>
          <div style={{ fontSize: 15, color: C.text, fontStyle: "italic", margin: "4px 0 16px" }}>“{interp.transcricao}”</div>

          {interp.avisos.map((a, i) => (
            <div key={i} style={{ background: C.dangerLight, color: "#7a2018", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 12 }}>{a}</div>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Select label="Onde lançar" value={interp.destino} onChange={v => setInterp(i => trocarDestino(i, v))}
              options={DESTINOS.map(d => ({ value: d.value, label: d.label }))} />

            {(interp.destino === "insumos" || interp.destino === "materiais") && (
              <>
                <Input label="Data" type="date" value={campos.date} onChange={v => setCampo("date", v)} />
                <Input label="Produto" value={campos.name} onChange={v => setCampo("name", v)} suggestions={nomesProduto} required />
                <Input label="Tipo" value={campos.tipo} onChange={v => setCampo("tipo", v)} suggestions={tipos} />
                <Input label="Fornecedor / Loja" value={campos.counter} onChange={v => setCampo("counter", v)} suggestions={nomesLoja} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <Input label="Qtd" type="number" value={campos.qty} onChange={v => setCampo("qty", v)} />
                  <Select label="Unidade" value={campos.unit} onChange={v => setCampo("unit", v)} options={opcoesCom(UNID_COMPRA, campos.unit)} />
                  <Input label="Preço unit." type="number" value={campos.unitPrice} onChange={v => setCampo("unitPrice", v)} />
                </div>
              </>
            )}

            {interp.destino === "maodeobra" && (
              <>
                <Input label="Data" type="date" value={campos.date} onChange={v => setCampo("date", v)} />
                <Input label="Trabalhador" value={campos.worker} onChange={v => setCampo("worker", v)} suggestions={nomesTrabalhador} required />
                <Input label="Serviço" value={campos.service} onChange={v => setCampo("service", v)} suggestions={nomesUsados(data.laborEntries, "service")} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <Select label="Tipo" value={campos.type} onChange={v => setCampo("type", v)}
                    options={["diarista", "mensalista", "empreitada", "temporário"].map(t => ({ value: t, label: t }))} />
                  <Input label="Dias/Qtd" type="number" value={campos.days} onChange={v => setCampo("days", v)} />
                  <Input label="Valor unit." type="number" value={campos.dailyRate} onChange={v => setCampo("dailyRate", v)} />
                </div>
              </>
            )}

            {interp.destino === "energia" && (
              <>
                <Input label="Mês referência" value={campos.month} onChange={v => setCampo("month", v)} suggestions={nomesUsados(data.energyBills, "month")} />
                <Input label="Vencimento" type="date" value={campos.date} onChange={v => setCampo("date", v)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Input label="kWh" type="number" value={campos.kwh} onChange={v => setCampo("kwh", v)} />
                  <Input label="Valor (R$)" type="number" value={campos.value} onChange={v => setCampo("value", v)} />
                </div>
              </>
            )}

            {interp.destino === "venda" && (
              <>
                <Input label="Data" type="date" value={campos.date} onChange={v => setCampo("date", v)} />
                <Select label="Produto" value={campos.type} onChange={v => setCampo("type", v)} options={TIPOS_FRUTA} />
                <Input label="Comprador" value={campos.buyer} onChange={v => setCampo("buyer", v)} suggestions={nomesComprador} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <Input label="Qtd" type="number" value={campos.qty} onChange={v => setCampo("qty", v)} />
                  <Select label="Unid" value={campos.unit} onChange={v => setCampo("unit", v)}
                    options={[{ value: "kg", label: "kg" }, { value: "caixa", label: `caixa (${CAIXA_KG} kg)` }]} />
                  <Input label={campos.unit === "caixa" ? "Preço da caixa" : "Preço do kg"} type="number" value={campos.unitPrice} onChange={v => setCampo("unitPrice", v)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <Select label="Situação" value={campos.payStatus} onChange={v => setCampo("payStatus", v)}
                    options={[{ value: "a_receber", label: "A receber" }, { value: "recebido", label: "Recebido" }]} />
                  <Select label="Forma" value={campos.payMethod} onChange={v => setCampo("payMethod", v)}
                    options={[{ value: "pix", label: "Pix" }, { value: "dinheiro", label: "Dinheiro" }]} />
                  <Select label="Dinheiro com" value={campos.holder} onChange={v => setCampo("holder", v)}
                    options={[{ value: "comigo", label: "Comigo" }, { value: "matheus", label: "Matheus" }]} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: campos.local === "cidade" ? "1fr 1fr" : "1fr", gap: 10 }}>
                  <Select label="Local da venda" value={campos.local}
                    onChange={v => setInterp(i => ({ ...i, campos: { ...i.campos, local: v, entregador: v === "cidade" ? (i.campos.entregador || "eu") : "" } }))}
                    options={[{ value: "roça", label: "Roça" }, { value: "cidade", label: "Cidade" }]} />
                  {campos.local === "cidade" && (
                    <Select label="Entregou" value={campos.entregador} onChange={v => setCampo("entregador", v)}
                      options={[{ value: "eu", label: "Eu" }, { value: "matheus", label: "Matheus" }]} />
                  )}
                </div>
              </>
            )}

            <Input label="Total (R$)" type="number" value={Math.round(total * 100) / 100} onChange={setTotal} />
            <div style={{ background: C.green50, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: C.textSoft }}>
              {resumoCurto(interp)} — <strong style={{ color: C.primary }}>{fmtMoney(total)}</strong>
            </div>

            {aviso && <div style={{ background: C.dangerLight, color: "#7a2018", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>{aviso}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Btn variant="ghost" onClick={() => { setInterp(null); setAviso(""); }}>Descartar</Btn>
              <Btn onClick={salvar}><Icon name="check" size={16} color="#fff" /> Salvar lançamento</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Como falar ────────────────────────────────────────────────── */}
      <Card>
        <h4 style={{ margin: "0 0 4px", color: C.text, fontSize: 15 }}>🗣️ Como falar</h4>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: C.muted }}>
          Diga o que comprou, quanto e onde. Data (“hoje”, “ontem”, “dia 12”), loja (“na Agro Rural”)
          e pessoa (“para o João”) são reconhecidas. Toque num exemplo para ver o que o app entende.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EXEMPLOS.map(ex => (
            <button key={ex} onClick={() => { setDigitado(ex); interpretar(ex); }}
              style={{ textAlign: "left", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: C.textSoft, cursor: "pointer", fontFamily: "inherit" }}>
              “{ex}”
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

const PAGINA = { insumos: "inputs", materiais: "materials", maodeobra: "labor", energia: "energy", venda: "fruits" };

// Frase curta descrevendo o lançamento montado
function resumoCurto(interp) {
  const c = interp.campos;
  if (interp.destino === "energia") return `Conta de luz · ${c.month || "sem referência"}`;
  if (interp.destino === "maodeobra") return `${c.worker || "trabalhador"} · ${fmt(Number(c.days) || 0, 0)} × ${fmtMoney(c.dailyRate)}`;
  if (interp.destino === "venda") return `${fmt(Number(c.qty) || 0, 0)} ${c.unit} · ${c.buyer || "sem comprador"} · ${fmtMoney(c.unitPrice)}/${c.unit}`;
  return `${c.name || "produto"} · ${fmt(Number(c.qty) || 0, 2)} ${c.unit} × ${fmtMoney(c.unitPrice)}${c.counter ? ` · ${c.counter}` : ""}`;
}
