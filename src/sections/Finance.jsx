import { C } from "../ui/theme";
import { fmtMoney } from "../lib/format";
import { Card, StatCard } from "../ui";

// ─── Finance ─────────────────────────────────────────────────────────────────
export default function Finance({ data }) {
  const receita = data.fruitSales.reduce((s, x) => s + Number(x.total || 0), 0);
  const insumos = data.inputPurchases.filter(x => x.type === "compra").reduce((s, x) => s + Number(x.total || 0), 0);
  const labor = data.laborEntries.reduce((s, x) => s + Number(x.total || 0), 0);
  const energy = data.energyBills.reduce((s, x) => s + Number(x.value || 0), 0);
  const materials = data.materialTransactions.filter(x => x.type === "compra").reduce((s, x) => s + Number(x.total || 0), 0);
  const totalCusto = insumos + labor + energy + materials;
  const resultado = receita - totalCusto;
  const items = [{ label: "Receita com Frutas", value: receita, t: "r" }, { label: "Insumos", value: insumos, t: "c" }, { label: "Mão de Obra", value: labor, t: "c" }, { label: "Energia", value: energy, t: "c" }, { label: "Materiais", value: materials, t: "c" }];
  return (
    <div>
      <h2 style={{ margin: "0 0 20px", color: C.text }}>Resumo Financeiro</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Receita" value={fmtMoney(receita)} icon="fruit" color={C.primary} /><StatCard label="Custos" value={fmtMoney(totalCusto)} icon="buy" color={C.danger} /><StatCard label={resultado >= 0 ? "Lucro" : "Prejuízo"} value={fmtMoney(Math.abs(resultado))} icon="finance" color={resultado >= 0 ? C.primaryLight : C.danger} />
      </div>
      <Card>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, color: C.text }}>Demonstrativo de Resultado (DRE)</h3>
        {items.map((it, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 }}><span style={{ color: C.textSoft }}>{it.label}</span><span style={{ fontWeight: 700, color: it.t === "r" ? C.primary : C.danger }}>{it.t === "r" ? "+" : "-"} {fmtMoney(it.value)}</span></div>))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0", fontSize: 16, fontWeight: 800 }}><span style={{ color: C.text }}>RESULTADO</span><span style={{ color: resultado >= 0 ? C.primary : C.danger }}>{fmtMoney(resultado)}</span></div>
      </Card>
    </div>
  );
}
