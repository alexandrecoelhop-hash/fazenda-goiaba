import { C } from "../ui/theme";
import { fmt, fmtMoney } from "../lib/format";
import { saleKg, CAIXA_KG } from "../lib/sales";
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

  // Custo por kg = custo total ÷ kg produzidos (vendidos)
  const totalKg = data.fruitSales.reduce((s, x) => s + saleKg(x), 0);
  const temKg = totalKg > 0;
  const perKg = (v) => (temKg ? v / totalKg : 0);
  const custoPorKg = perKg(totalCusto);
  const precoMedioKg = perKg(receita);
  const resultadoPorKg = perKg(resultado);
  const custoPorCaixa = custoPorKg * CAIXA_KG;
  const perKgItems = [
    { label: "Insumos", value: perKg(insumos) },
    { label: "Mão de Obra", value: perKg(labor) },
    { label: "Energia", value: perKg(energy) },
    { label: "Materiais", value: perKg(materials) },
  ];

  // Ponto de equilíbrio: quanto ainda falta receber/produzir para cobrir o que já foi gasto
  const semLancamentos = totalCusto === 0 && receita === 0;
  const noLucro = resultado >= 0;
  const faltaReceita = Math.max(0, totalCusto - receita);
  const kgEquilibrio = precoMedioKg > 0 ? totalCusto / precoMedioKg : 0;   // kg totais para empatar (ao preço médio)
  const faltaKg = Math.max(0, kgEquilibrio - totalKg);
  const kgAcima = Math.max(0, totalKg - kgEquilibrio);
  const pctCoberto = totalCusto > 0 ? Math.min(100, (receita / totalCusto) * 100) : 100;

  const items = [{ label: "Receita com Frutas", value: receita, t: "r" }, { label: "Insumos", value: insumos, t: "c" }, { label: "Mão de Obra", value: labor, t: "c" }, { label: "Energia", value: energy, t: "c" }, { label: "Materiais", value: materials, t: "c" }];
  const box = (label, value, color, bg) => (
    <div style={{ background: bg, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{fmtMoney(value)}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>por kg</div>
    </div>
  );
  return (
    <div>
      <h2 style={{ margin: "0 0 20px", color: C.text }}>Resumo Financeiro</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Receita" value={fmtMoney(receita)} icon="fruit" color={C.primary} /><StatCard label="Custos" value={fmtMoney(totalCusto)} icon="buy" color={C.danger} /><StatCard label={resultado >= 0 ? "Lucro" : "Prejuízo"} value={fmtMoney(Math.abs(resultado))} icon="finance" color={resultado >= 0 ? C.primaryLight : C.danger} />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, color: C.text }}>Custo por quilo produzido</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: C.muted }}>
          {temKg
            ? <>Baseado em <strong>{fmt(totalKg, 0)} kg</strong> vendidos (= {fmt(totalKg / CAIXA_KG, 1)} caixas de {CAIXA_KG} kg). Atualiza sozinho a cada lançamento.</>
            : "Lance ao menos uma venda de fruta para calcular o custo por quilo."}
        </p>
        {temKg && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
              {box("Custo por kg", custoPorKg, C.danger, C.dangerLight)}
              {box("Preço médio recebido", precoMedioKg, C.primary, C.green50)}
              {box(resultadoPorKg >= 0 ? "Lucro por kg" : "Prejuízo por kg", Math.abs(resultadoPorKg), resultadoPorKg >= 0 ? C.primary : C.danger, resultadoPorKg >= 0 ? C.green50 : C.dangerLight)}
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6 }}>De onde vem o custo por kg</div>
            {perKgItems.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.textSoft }}>{it.label}</span>
                <span style={{ fontWeight: 600, color: C.text }}>{fmtMoney(it.value)} / kg</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 15, fontWeight: 800 }}>
              <span style={{ color: C.text }}>Custo total por kg</span>
              <span style={{ color: C.danger }}>{fmtMoney(custoPorKg)} / kg</span>
            </div>
            <div style={{ marginTop: 10, background: C.bg, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.textSoft }}>
              Equivale a <strong>{fmtMoney(custoPorCaixa)}</strong> por caixa de {CAIXA_KG} kg.
            </div>
          </>
        )}
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, color: C.text }}>Quanto falta para começar a dar lucro</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: C.muted }}>
          Ponto de equilíbrio a partir do que já foi gasto (<strong>{fmtMoney(totalCusto)}</strong> em custos). Atualiza sozinho a cada lançamento.
        </p>
        {semLancamentos ? (
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Ainda não há custos nem vendas lançados.</p>
        ) : noLucro ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <div style={{ background: C.green50, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Situação</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>Já dá lucro 🎉</div>
            </div>
            <div style={{ background: C.green50, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Lucro atual</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{fmtMoney(resultado)}</div>
            </div>
            {precoMedioKg > 0 && (
              <div style={{ background: C.green50, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Produção acima do equilíbrio</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{fmt(kgAcima, 0)} kg</div>
              </div>
            )}
          </div>
        ) : !temKg ? (
          <div style={{ background: C.dangerLight, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Falta receber para empatar</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.danger }}>{fmtMoney(faltaReceita)}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Lance uma venda para estimar quantos kg faltam (precisamos do preço de venda).</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div style={{ background: C.dangerLight, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Falta produzir</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.danger }}>{fmt(faltaKg, 0)} kg</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>= {fmt(faltaKg / CAIXA_KG, 1)} caixas de {CAIXA_KG} kg</div>
              </div>
              <div style={{ background: C.dangerLight, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Falta receber</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.danger }}>{fmtMoney(faltaReceita)}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>ao preço médio de {fmtMoney(precoMedioKg)}/kg</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
              <span>Custos já cobertos pela receita</span><span>{fmt(pctCoberto, 0)}%</span>
            </div>
            <div style={{ background: C.border, borderRadius: 999, height: 12, overflow: "hidden" }}>
              <div style={{ width: `${pctCoberto}%`, height: "100%", background: C.accent, transition: "width .3s" }} />
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: C.textSoft }}>
              No equilíbrio você terá vendido <strong>{fmt(kgEquilibrio, 0)} kg</strong> ({fmt(kgEquilibrio / CAIXA_KG, 1)} caixas). Já foram {fmt(totalKg, 0)} kg.
            </div>
          </>
        )}
      </Card>

      <Card>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, color: C.text }}>Demonstrativo de Resultado (DRE)</h3>
        {items.map((it, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 }}><span style={{ color: C.textSoft }}>{it.label}</span><span style={{ fontWeight: 700, color: it.t === "r" ? C.primary : C.danger }}>{it.t === "r" ? "+" : "-"} {fmtMoney(it.value)}</span></div>))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0", fontSize: 16, fontWeight: 800 }}><span style={{ color: C.text }}>RESULTADO</span><span style={{ color: resultado >= 0 ? C.primary : C.danger }}>{fmtMoney(resultado)}</span></div>
      </Card>
    </div>
  );
}
