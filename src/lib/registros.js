// Registros que se montam sozinhos a partir dos lançamentos, pelo nome digitado.
const nomeDe = (v) => (v || "").trim() || "(sem nome)";

// Nomes já usados num campo, para sugerir enquanto o usuário digita
export const nomesUsados = (lista, campo) =>
  [...new Set(lista.map(x => (x[campo] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));

// Mão de obra: dias/diárias e valor pago por trabalhador
export const workerSummary = (laborEntries) => {
  const m = {};
  laborEntries.forEach(x => {
    const nome = nomeDe(x.worker);
    m[nome] = m[nome] || { nome, dias: 0, servicos: 0, total: 0, tipos: new Set(), ultima: "" };
    m[nome].dias += Number(x.days || 0);
    m[nome].servicos += 1;
    m[nome].total += Number(x.total || 0);
    if (x.type) m[nome].tipos.add(x.type);
    if ((x.date || "") > m[nome].ultima) m[nome].ultima = x.date || "";
  });
  return Object.values(m).map(w => ({ ...w, tipos: [...w.tipos].join(", ") })).sort((a, b) => b.total - a.total);
};

// Insumos/Materiais: quanto foi comprado de cada loja (ou vendido a cada comprador)
export const counterSummary = (lancamentos, tipo) => {
  const m = {};
  lancamentos.filter(x => x.type === tipo).forEach(x => {
    const nome = nomeDe(x.counter);
    m[nome] = m[nome] || { nome, compras: 0, total: 0, ultima: "", produtos: new Set() };
    m[nome].compras += 1;
    m[nome].total += Number(x.total || 0);
    if (x.name) m[nome].produtos.add(x.name.trim());
    if ((x.date || "") > m[nome].ultima) m[nome].ultima = x.date || "";
  });
  return Object.values(m).map(c => ({ ...c, produtos: [...c.produtos].join(", ") })).sort((a, b) => b.total - a.total);
};
