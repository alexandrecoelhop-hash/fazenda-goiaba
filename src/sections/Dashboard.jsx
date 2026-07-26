import { useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C, CHART_COLORS } from "../ui/theme";
import { fmt, fmtMoney, fmtDate, monthKey, today } from "../lib/format";
import { saleKg } from "../lib/sales";
import { Card, StatCard, Badge } from "../ui";

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard label="Receita com Frutas" value={fmtMoney(receita)} icon="fruit" color={C.primary} />
        <StatCard label="Custo Total" value={fmtMoney(totalCustos)} icon="buy" color={C.danger} />
        <StatCard label="Resultado" value={fmtMoney(saldo)} icon="finance" color={saldo >= 0 ? C.primaryLight : C.danger} sub={saldo >= 0 ? "Lucro" : "Prejuízo"} />
        <StatCard label="Custo por kg" value={totalKg > 0 ? fmtMoney(custoPorKg) : "—"} icon="buy" color={C.accentDark} sub={totalKg > 0 ? `${fmt(totalKg, 0)} kg produzidos` : "sem produção lançada"} />
        <StatCard label="Estoque" value={`${data.stockItems.length} itens`} icon="stock" color={C.accentDark} sub={stockAlerts.length ? `⚠ ${stockAlerts.length} em alerta` : "OK"} />
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
    </div>
  );
}
