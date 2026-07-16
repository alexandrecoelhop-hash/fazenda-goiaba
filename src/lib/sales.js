// Conversão de unidades da venda de frutas: 1 caixa de goiaba = 30 kg
export const CAIXA_KG = 30;
// Aceita variações antigas digitadas à mão ("Caixa", "caixa ", etc.)
export const isCaixa = (x) => String(x.unit || "").trim().toLowerCase() === "caixa";
export const saleKg = (x) => Number(x.qty || 0) * (isCaixa(x) ? CAIXA_KG : 1);

// Registro por comprador: caixas, kg, total comprado e valor ainda a receber
export const buyerSummary = (fruitSales) => {
  const m = {};
  fruitSales.forEach(x => {
    const nome = (x.buyer || "").trim() || "(sem nome)";
    m[nome] = m[nome] || { nome, caixas: 0, kg: 0, total: 0, aReceber: 0 };
    if (isCaixa(x)) m[nome].caixas += Number(x.qty || 0);
    m[nome].kg += saleKg(x);
    m[nome].total += Number(x.total || 0);
    if (x.payStatus !== "recebido") m[nome].aReceber += Number(x.total || 0);
  });
  return Object.values(m).sort((a, b) => b.kg - a.kg);
};
