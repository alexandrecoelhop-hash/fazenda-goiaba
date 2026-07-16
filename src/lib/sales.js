// Conversão de unidades da venda de frutas: 1 caixa de goiaba = 30 kg
export const CAIXA_KG = 30;
export const saleKg = (x) => Number(x.qty || 0) * (x.unit === "caixa" ? CAIXA_KG : 1);
