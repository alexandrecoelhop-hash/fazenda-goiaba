// Registros que se montam sozinhos a partir dos lançamentos, pelo nome digitado.
const nomeDe = (v) => (v || "").trim() || "(sem nome)";

// ─── Listas de sugestão padrão (o app aprende novas conforme você usa) ───────
export const TIPOS_PRODUTO = [
  "Adubo foliar", "Adubo granulado", "Fertirrigação", "Micronutriente",
  "Inseticida", "Fungicida", "Herbicida", "Acaricida", "Nematicida", "Bactericida",
  "Óleo mineral", "Espalhante adesivo", "Calcário", "Gesso agrícola",
  "Semente / Muda", "Embalagem", "Ferramenta", "Combustível", "Outro",
];
export const UNIDADES_COMUNS = ["kg", "sc", "L", "mL", "un", "cx", "rl", "pct", "g", "t", "m", "dose"];
export const VARIEDADES = ["Paluma", "Rica", "Pedro Sato", "Século XXI", "Cortibel", "Kumagai"];

// As duas válvulas de irrigação da fazenda. Manejo, aplicações e adubação
// são organizados por válvula.
export const VALVULAS = ["Válvula 1", "Válvula 2"];
// Opções para o seletor de válvula: as duas fixas + qualquer valor já lançado
// (mantém compatível com registros antigos que usavam texto livre).
export const valvulaOptions = (...usados) => {
  const set = new Set(VALVULAS);
  usados.flat().forEach(v => { const s = (v ?? "").toString().trim(); if (s) set.add(s); });
  return [{ value: "", label: "— selecione —" }, ...[...set].map(v => ({ value: v, label: v }))];
};

// Nomes já usados num campo, para sugerir enquanto o usuário digita
export const nomesUsados = (lista, campo) =>
  [...new Set(lista.map(x => (x[campo] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));

// Junta valores padrão + tudo que já foi digitado (em uma ou mais listas), sem repetir.
// Ex.: listaSugestoes(TIPOS_PRODUTO, data.inputPurchases.map(x => x.tipo), ...)
export const listaSugestoes = (defaults = [], ...valores) => {
  const set = new Set(defaults);
  valores.flat().forEach(v => { const s = (v ?? "").toString().trim(); if (s) set.add(s); });
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
};

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
