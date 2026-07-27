import { useMemo, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C, CHART_COLORS } from "../ui/theme";
import { fmt, fmtMoney, fmtDate, monthKey, today } from "../lib/format";
import { saleKg } from "../lib/sales";
import { PLANTAS_PRODUZINDO } from "../lib/fazenda";
import { Card, StatCard, Badge, Modal } from "../ui";

// Linha "rótulo … valor" usada nos resumos de cada indicador
const Linha = ({ label, valor, sub, forte, cor }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
    <span style={{ color: C.textSoft }}>{label}{sub && <span style={{ color: C.muted, fontSize: 12 }}> · {sub}</span>}</span>
    <span style={{ fontWeight: forte ? 800 : 700, color: cor || C.text, whiteSpace: "nowrap" }}>{valor}</span>
  </div>
);
const TIPOS_FRUTA = { verde: "Goiaba Verde", polpa: "Polpa", madura: "Goiaba Madura", refugo: "Refugo" };

// ─── DASHBOARD (com gráficos) ─────────────────────────────────────────────────
export default function Dashboard({ data }) {
  const receita = data.fruitSales.reduce((s, x) => s + Number(x.total || 0), 0);
  const insumos = data.inputPurchases.filter(x => x.type === "compra").reduce((s, x) => s + Number(x.total || 0), 0);
  const labor = data.laborEntries.reduce((s, x) => s + Number(x.total || 0), 0);
  const energy = data.energyBills.reduce((s, x) => s + Number(x.value || 0), 0);
  const materials = data.materialTransactions.filter(x => x.type === "compra").reduce((s, x) => s + Number(x.total || 0), 0);
  const totalCustos = insumos + labor + energy + materials;
  const saldo = receita - totalCustos;
  const totalKg = data.fruitSales.reduce((s, x) => s + saleKg(x), 0);
  const custoPorKg = totalKg > 0 ? totalCustos / totalKg : 0;
  // Quanto ainda falta produzir para cobrir o que já foi gasto (ao preço médio de venda)
  const precoMedioKg = totalKg > 0 ? receita / totalKg : 0;
  const faltaKg = precoMedioKg > 0 ? Math.max(0, totalCustos / precoMedioKg - totalKg) : 0;

  const monthly = useMemo(() => {
    const m = {};
    data.fruitSales.forEach(x => { const k = monthKey(x.date); if (!k) return; m[k] = m[k] || { mes: k, receita: 0, custo: 0 }; m[k].receita += Number(x.total || 0); });
    const addCusto = (arr, key = "total") => arr.forEach(x => { const k = monthKey(x.date); if (!k) return; m[k] = m[k] || { mes: k, receita: 0, custo: 0 }; m[k].custo += Number(x[key] || 0); });
    addCusto(data.inputPurchases.filter(x => x.type === "compra"));
    addCusto(data.laborEntries);
    addCusto(data.energyBills, "value");
    addCusto(data.materialTransactions.filter(x => x.type === "compra"));
    return Object.values(m).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [data]);

  const custoPie = [
    { name: "Insumos", value: insumos }, { name: "Mão de Obra", value: labor },
    { name: "Energia", value: energy }, { name: "Materiais", value: materials },
  ].filter(x => x.value > 0);

  const fruitByType = useMemo(() => {
    const m = {};
    data.fruitSales.forEach(x => { m[x.type] = (m[x.type] || 0) + saleKg(x); });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [data]);

  const nextEvents = data.agronomicEvents.filter(e => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const stockAlerts = data.stockItems.filter(s => Number(s.qty) <= Number(s.minQty || 0));

  // Resumo ao clicar em cada indicador
  const [detalhe, setDetalhe] = useState(null);
  const receitaPorTipo = useMemo(() => {
    const m = {};
    data.fruitSales.forEach(x => { const t = x.type || "outro"; m[t] = m[t] || { tipo: t, valor: 0, kg: 0, n: 0 }; m[t].valor += Number(x.total || 0); m[t].kg += saleKg(x); m[t].n += 1; });
    return Object.values(m).sort((a, b) => b.valor - a.valor);
  }, [data]);
  const custoItens = [
    { label: "Insumos", valor: insumos, n: data.inputPurchases.filter(x => x.type === "compra").length },
    { label: "Mão de Obra", valor: labor, n: data.laborEntries.length },
    { label: "Energia", valor: energy, n: data.energyBills.length },
    { label: "Materiais", valor: materials, n: data.materialTransactions.filter(x => x.type === "compra").length },
  ];
  const TITULOS = { receita: "Receita com Frutas", custo: "Custo Total", resultado: "Resultado", custokg: "Custo por kg", falta: "Falta para dar lucro", estoque: "Estoque" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: C.green50, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.textSoft, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>🌱</span>
        <span>Hoje temos <strong style={{ color: C.primary }}>{fmt(PLANTAS_PRODUZINDO, 0)} goiabeiras</strong> em produção.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard label="Receita com Frutas" value={fmtMoney(receita)} icon="fruit" color={C.primary} onClick={() => setDetalhe("receita")} />
        <StatCard label="Custo Total" value={fmtMoney(totalCustos)} icon="buy" color={C.danger} onClick={() => setDetalhe("custo")} />
        <StatCard label="Resultado" value={fmtMoney(saldo)} icon="finance" color={saldo >= 0 ? C.primaryLight : C.danger} sub={saldo >= 0 ? "Lucro" : "Prejuízo"} onClick={() => setDetalhe("resultado")} />
        <StatCard label="Custo por kg" value={totalKg > 0 ? fmtMoney(custoPorKg) : "—"} icon="buy" color={C.accentDark} sub={totalKg > 0 ? `${fmt(totalKg, 0)} kg produzidos` : "sem produção lançada"} onClick={() => setDetalhe("custokg")} />
        <StatCard label="Falta p/ dar lucro" value={saldo >= 0 ? "no lucro ✓" : (precoMedioKg > 0 ? `${fmt(faltaKg, 0)} kg` : "—")} icon="fruit" color={saldo >= 0 ? C.primaryLight : C.accentDark} sub={saldo >= 0 ? "já passou do equilíbrio" : (precoMedioKg > 0 ? `faltam ${fmtMoney(totalCustos - receita)}` : "lance uma venda")} onClick={() => setDetalhe("falta")} />
        <StatCard label="Estoque" value={`${data.stockItems.length} itens`} icon="stock" color={C.accentDark} sub={stockAlerts.length ? `⚠ ${stockAlerts.length} em alerta` : "OK"} onClick={() => setDetalhe("estoque")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card>
          <h4 style={{ margin: "0 0 14px", color: C.text, fontSize: 15 }}>Receita × Custo por mês</h4>
          {monthly.length === 0 ? <p style={{ color: C.muted, fontSize: 13 }}>Sem dados para exibir.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="mes" fontSize={11} /><YAxis fontSize={11} />
                <Tooltip formatter={(v) => fmtMoney(v)} />
                <Legend />
                <Bar dataKey="receita" name="Receita" fill={C.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="custo" name="Custo" fill={C.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card>
          <h4 style={{ margin: "0 0 14px", color: C.text, fontSize: 15 }}>Composição de Custos</h4>
          {custoPie.length === 0 ? <p style={{ color: C.muted, fontSize: 13 }}>Sem custos lançados.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={custoPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={(e) => e.name}>
                  {custoPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <h4 style={{ margin: "0 0 14px", color: C.text, fontSize: 15 }}>Volume vendido por produto (kg)</h4>
          {fruitByType.length === 0 ? <p style={{ color: C.muted, fontSize: 13 }}>Sem vendas.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fruitByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" fontSize={11} width={70} />
                <Tooltip formatter={(v) => `${fmt(v)} kg`} />
                <Bar dataKey="value" name="kg" fill={C.accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card>
          <h4 style={{ margin: "0 0 14px", color: C.text, fontSize: 15 }}>📅 Próximos eventos & alertas</h4>
          {nextEvents.map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: C.green50, borderRadius: 8, marginBottom: 6 }}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{e.title || e.type}</div><div style={{ fontSize: 12, color: C.muted }}>{e.talhao} — {fmtDate(e.date)}</div></div>
              <Badge color={C.primary}>{e.type}</Badge>
            </div>
          ))}
          {stockAlerts.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: C.dangerLight, borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
              <span>⚠ {s.name}</span><strong style={{ color: C.danger }}>{s.qty} {s.unit}</strong>
            </div>
          ))}
          {nextEvents.length === 0 && stockAlerts.length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>Nada pendente.</p>}
        </Card>
      </div>

      {detalhe && (
        <Modal title={TITULOS[detalhe]} onClose={() => setDetalhe(null)}>
          {detalhe === "receita" && (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: C.muted }}>Soma de todas as vendas lançadas em <strong>Venda de Frutas</strong> ({data.fruitSales.length} venda(s)).</p>
              {receitaPorTipo.length === 0
                ? <p style={{ fontSize: 13, color: C.muted }}>Nenhuma venda lançada.</p>
                : receitaPorTipo.map(r => <Linha key={r.tipo} label={TIPOS_FRUTA[r.tipo] || r.tipo} sub={`${fmt(r.kg, 0)} kg`} valor={fmtMoney(r.valor)} />)}
              <Linha label="Total" valor={fmtMoney(receita)} forte cor={C.primary} />
            </>
          )}
          {detalhe === "custo" && (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: C.muted }}>Tudo que já foi gasto, somado por categoria.</p>
              {custoItens.map(c => <Linha key={c.label} label={c.label} sub={`${c.n} lançamento(s)`} valor={fmtMoney(c.valor)} />)}
              <Linha label="Custo total" valor={fmtMoney(totalCustos)} forte cor={C.danger} />
            </>
          )}
          {detalhe === "resultado" && (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: C.muted }}>Receita menos custos.</p>
              <Linha label="Receita com frutas" valor={`+ ${fmtMoney(receita)}`} cor={C.primary} />
              <Linha label="Custos" valor={`− ${fmtMoney(totalCustos)}`} cor={C.danger} />
              <Linha label={saldo >= 0 ? "Lucro" : "Prejuízo"} valor={fmtMoney(saldo)} forte cor={saldo >= 0 ? C.primary : C.danger} />
            </>
          )}
          {detalhe === "custokg" && (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: C.muted }}>Custo total dividido pela produção vendida.</p>
              <Linha label="Custo total" valor={fmtMoney(totalCustos)} />
              <Linha label="Produção vendida" valor={`${fmt(totalKg, 0)} kg`} />
              <Linha label="Custo por kg" valor={totalKg > 0 ? fmtMoney(custoPorKg) : "—"} forte cor={C.accentDark} />
              {totalKg > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
                  Por kg: Insumos {fmtMoney(insumos / totalKg)} · Mão de obra {fmtMoney(labor / totalKg)} · Energia {fmtMoney(energy / totalKg)} · Materiais {fmtMoney(materials / totalKg)}.
                </div>
              )}
            </>
          )}
          {detalhe === "falta" && (saldo >= 0 ? (
            <p style={{ fontSize: 14, color: C.textSoft }}>Você já passou do ponto de equilíbrio — cada kg vendido agora é lucro. 🎉</p>
          ) : (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: C.muted }}>Quanto ainda falta produzir para cobrir o que já foi gasto, ao preço médio que você vem vendendo.</p>
              <Linha label="Custo total" valor={fmtMoney(totalCustos)} />
              <Linha label="Já recebido (receita)" valor={fmtMoney(receita)} />
              <Linha label="Falta receber" valor={fmtMoney(totalCustos - receita)} cor={C.danger} />
              <Linha label="Preço médio de venda" valor={precoMedioKg > 0 ? `${fmtMoney(precoMedioKg)}/kg` : "—"} />
              <Linha label="Falta produzir" valor={precoMedioKg > 0 ? `${fmt(faltaKg, 0)} kg` : "—"} forte cor={C.accentDark} />
            </>
          ))}
          {detalhe === "estoque" && (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: C.muted }}>{data.stockItems.length} item(ns) no estoque{stockAlerts.length ? `, ${stockAlerts.length} em alerta` : ""}.</p>
              {data.stockItems.length === 0
                ? <p style={{ fontSize: 13, color: C.muted }}>Estoque vazio.</p>
                : data.stockItems.map(s => {
                    const alerta = Number(s.qty) <= Number(s.minQty || 0);
                    return <Linha key={s.id} label={`${alerta ? "⚠ " : ""}${s.name}`} valor={`${s.qty} ${s.unit || ""}`} cor={alerta ? C.danger : C.text} />;
                  })}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
