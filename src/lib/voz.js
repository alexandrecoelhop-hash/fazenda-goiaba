// ─── Lançamento por voz: transforma a frase falada em um lançamento ──────────
// Tudo acontece no próprio aparelho: o navegador transforma a fala em texto e
// este arquivo transforma o texto em um lançamento pronto para conferir.
// Nada é salvo sem a conferência na tela.
import { today, addDays } from "./format";

const semAcento = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// ─── Números por extenso ("duzentos e cinquenta" → "250") ────────────────────
const PALAVRA_NUM = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6,
  sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, catorze: 14,
  quatorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70,
  oitenta: 80, noventa: 90, cem: 100, cento: 100,
  duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300,
  quatrocentos: 400, quatrocentas: 400, quinhentos: 500, quinhentas: 500,
  seiscentos: 600, seiscentas: 600, setecentos: 700, setecentas: 700,
  oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900,
};
const MULTIPLICADOR = { mil: 1000, milhao: 1e6, milhoes: 1e6 };
const METADE = { meio: 0.5 };

const valorSequencia = (seq) => {
  let total = 0, atual = 0, viu = false;
  for (const t of seq) {
    if (t === "e") continue;
    if (METADE[t] != null) { atual += METADE[t]; viu = true; continue; }
    if (PALAVRA_NUM[t] != null) { atual += PALAVRA_NUM[t]; viu = true; continue; }
    if (MULTIPLICADOR[t] != null) { atual = (atual || 1) * MULTIPLICADOR[t]; total += atual; atual = 0; viu = true; continue; }
    return null;
  }
  return viu ? total + atual : null;
};
const formatarNum = (v) => (Number.isInteger(v) ? String(v) : String(v).replace(".", ","));

export function numerosPorExtenso(texto) {
  const toks = String(texto).split(" ").filter(Boolean);
  const ch = toks.map(t => semAcento(t.toLowerCase()));
  const ehPalavraNum = (i) => i < toks.length && (PALAVRA_NUM[ch[i]] != null || MULTIPLICADOR[ch[i]] != null || METADE[ch[i]] != null);
  const saida = [];
  let i = 0;
  while (i < toks.length) {
    if (!ehPalavraNum(i)) { saida.push(toks[i]); i++; continue; }
    const seq = []; let j = i, fim = i;
    while (j < toks.length) {
      if (ehPalavraNum(j)) { seq.push(ch[j]); fim = j; j++; continue; }
      if (ch[j] === "e" && ehPalavraNum(j + 1)) { seq.push("e"); j++; continue; }
      break;
    }
    const v = valorSequencia(seq);
    if (v == null) { saida.push(toks[i]); i++; continue; }
    saida.push(formatarNum(v));
    i = fim + 1;
  }
  return saida.join(" ");
}

// ─── Números escritos (aceita 1.250,50 e 1250.5) ─────────────────────────────
const ehNumero = (t) => /^\d+(?:[.,]\d+)*$/.test(t);
const paraNumero = (s) => {
  let t = String(s).replace(/[^\d.,]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  const n = Number(t);
  return isNaN(n) ? null : n;
};

// ─── Unidades faladas → unidades do app ──────────────────────────────────────
const UNIDADES = [
  { u: "kg", re: /^(kg|kgs|quilos?|quilogramas?|kilos?)$/ },
  { u: "sc", re: /^(sc|sacos?|sacas?)$/ },
  { u: "L", re: /^(l|lt|lts|litros?)$/ },
  { u: "ml", re: /^(ml|mililitros?)$/ },
  { u: "bombona", re: /^(bombonas?|galao|galoes?|gl)$/ },
  { u: "caixa", re: /^(caixas?|cx|cxs)$/ },
  { u: "un", re: /^(un|und|unidades?|pecas?|pacotes?|pct|fardos?|rolos?|sacolas?)$/ },
  { u: "diaria", re: /^(diarias?|jornadas?|dias?)$/ },
  { u: "m", re: /^(m|metros?)$/ },
  { u: "t", re: /^(t|toneladas?)$/ },
  { u: "h", re: /^(h|horas?)$/ },
];
const unidadeDe = (t) => (UNIDADES.find(x => x.re.test(t)) || {}).u || null;
const ehDinheiroPalavra = (t) => /^(reais?|real|conto|contos|pila|pilas|pau)$/.test(t);

// ─── Datas faladas ───────────────────────────────────────────────────────────
const MESES = { janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
const MES_NOME = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const dataDeDiaMes = (dia, mes) => {
  const hoje = new Date(today() + "T00:00:00");
  let ano = hoje.getFullYear();
  let m = mes != null ? mes - 1 : hoje.getMonth();
  const montar = (a, mm) => `${a}-${String(mm + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  let d = montar(ano, m);
  // Sem mês dito, "dia 12" no dia 3 quer dizer o mês passado
  if (mes == null && d > today()) { m -= 1; if (m < 0) { m = 11; ano -= 1; } d = montar(ano, m); }
  else if (mes != null && d > today()) d = montar(ano - 1, m);
  return d;
};
export const mesReferencia = (dataISO) => {
  const d = new Date((dataISO || today()) + "T00:00:00");
  return `${MES_NOME[d.getMonth()]}/${d.getFullYear()}`;
};

// ─── Para onde vai o lançamento ──────────────────────────────────────────────
const regra = (termos) => new RegExp("(^| )(" + termos.join("|") + ")( |$)");
const R_VENDA = regra(["vendi", "vendemos", "vendida", "vendidas", "venda de goiaba", "venda de fruta", "faturei"]);
const R_ENERGIA = regra(["conta de luz", "conta de energia", "energia eletrica", "luz", "energia", "cemig", "energisa", "enel", "cpfl", "celesc", "coelba", "equatorial"]);
const R_MAOOBRA = regra(["diaria", "diarias", "diarista", "diaristas", "mao de obra", "empreitada", "empreiteiro", "funcionario", "funcionarios", "trabalhador", "trabalhadores", "peao", "peoes", "ajudante", "tratorista", "salario", "dia de servico", "dia de trabalho", "colheitador", "colhedor"]);
const R_INSUMO = regra(["adubo", "adubos", "fertilizante", "ureia", "npk", "calcario", "gesso", "foliar", "fungicida", "inseticida", "herbicida", "acaricida", "nematicida", "formicida", "defensivo", "espalhante", "oleo mineral", "micronutriente", "boro", "zinco", "semente", "sementes", "muda", "mudas", "insumo", "insumos"]);
const R_MATERIAL = regra(["material", "materiais", "cano", "canos", "mangueira", "mangueiras", "tela", "arame", "ferramenta", "ferramentas", "parafuso", "parafusos", "cimento", "areia", "brita", "tijolo", "madeira", "pneu", "pneus", "diesel", "gasolina", "combustivel", "conserto", "manutencao", "bomba", "conexao", "conexoes", "gotejador", "fita gotejadora", "enxada", "facao", "motosserra", "rocadeira", "luva", "luvas", "bota", "botas", "epi", "embalagem", "embalagens", "caixa vazia"]);

const acharDestino = (frase) => {
  if (R_VENDA.test(frase)) return "venda";
  if (R_ENERGIA.test(frase)) return "energia";
  if (R_MAOOBRA.test(frase)) return "maodeobra";
  if (R_INSUMO.test(frase)) return "insumos";
  if (R_MATERIAL.test(frase)) return "materiais";
  return "insumos";
};

// Palpite do campo "Tipo" do produto, a partir da frase
const TIPOS_PALPITE = [
  [/(foliar|micronutriente|boro|zinco|molibdenio)/, "Adubo foliar"],
  [/(inseticida|formicida)/, "Inseticida"],
  [/(fungicida)/, "Fungicida"],
  [/(herbicida)/, "Herbicida"],
  [/(acaricida)/, "Acaricida"],
  [/(nematicida)/, "Nematicida"],
  [/(calcario)/, "Calcário"],
  [/(gesso)/, "Gesso agrícola"],
  [/(espalhante)/, "Espalhante adesivo"],
  [/(oleo mineral)/, "Óleo mineral"],
  [/(semente|muda)/, "Semente / Muda"],
  [/(diesel|gasolina|combustivel)/, "Combustível"],
  [/(embalagem|caixa vazia|sacaria)/, "Embalagem"],
  [/(enxada|facao|motosserra|rocadeira|ferramenta)/, "Ferramenta"],
  [/(ureia|npk|fertilizante|adubo)/, "Adubo granulado"],
];
const palpiteTipo = (frase) => (TIPOS_PALPITE.find(([re]) => re.test(frase)) || [])[1] || "";

// ─── Palavras que nunca fazem parte do nome do produto ───────────────────────
const RUIDO = new Set([
  "comprei", "compramos", "comprar", "compra", "gastei", "gastar", "gasto", "paguei", "pagamos", "pagar",
  "peguei", "adquiri", "levei", "usei", "vendi", "vendemos", "recebi", "faturei", "anota", "anotar", "lanca",
  "lancar", "registra", "registrar", "abasteci", "abastecemos", "enchi", "botei", "coloquei", "entregou", "entreguei", "foi", "custou", "custa", "deu", "saiu", "ficou", "fica", "total",
  "no", "na", "nos", "nas", "em", "de", "do", "da", "dos", "das", "com", "por", "pelo", "pela", "pra", "pro",
  "para", "o", "a", "os", "as", "um", "uma", "e", "mais", "menos", "hoje", "ontem", "anteontem", "dia",
  "reais", "real", "conto", "contos", "pila", "pilas", "pau", "r$", "cada", "aqui", "la", "ai", "ja", "que",
  "meu", "minha", "loja", "fornecedor", "seu", "sua", "esse", "essa", "isso", "sendo", "ao", "aos", "as",
  "unidade", "cheguei", "gente", "eu", "nos", "so", "tambem", "conta", "valor", "preco",
]);
const PARADAS = new Set(["por", "a", "o", "de", "do", "da", "com", "para", "e", "hoje", "ontem", "anteontem", "no", "na", "em", "r$", "reais", "real", "total", "cada", "mais", "que", "pra", "pro", "dia"]);

// ─── Interpretação ───────────────────────────────────────────────────────────
export function interpretarFala(textoBruto) {
  const transcricao = String(textoBruto || "").trim();
  const limpo = transcricao
    .replace(/([.;:!?])(?!\d)/g, " ")
    .replace(/,(?!\d)/g, " ")
    .replace(/r\$\s*/gi, "r$ ")
    .replace(/(\d)\s*(kg|kgs|g|l|lt|ml|un|cx|sc|t|m)\b/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  const texto = numerosPorExtenso(limpo);
  const toks = texto.split(" ").filter(Boolean);
  const ch = toks.map(t => semAcento(t.toLowerCase()));
  const usado = new Array(toks.length).fill(false);
  const frase = " " + ch.join(" ") + " ";
  const marcar = (...ii) => ii.forEach(i => { if (i >= 0 && i < usado.length) usado[i] = true; });

  const destino = acharDestino(frase);
  const avisos = [];

  // 1) Data
  let data = today();
  for (let i = 0; i < toks.length; i++) {
    if (usado[i]) continue;
    if (ch[i] === "hoje") { data = today(); marcar(i); continue; }
    if (ch[i] === "ontem") { data = addDays(today(), -1); marcar(i); continue; }
    if (ch[i] === "anteontem") { data = addDays(today(), -2); marcar(i); continue; }
    if (ch[i] === "dia" && ehNumero(ch[i + 1] || "")) {
      const dia = paraNumero(ch[i + 1]);
      if (dia >= 1 && dia <= 31) {
        let mes = null, fim = i + 1;
        if (ch[i + 2] === "de" && MESES[ch[i + 3]] != null) { mes = MESES[ch[i + 3]]; fim = i + 3; }
        data = dataDeDiaMes(dia, mes);
        for (let k = i; k <= fim; k++) marcar(k);
      }
      continue;
    }
    if (ehNumero(ch[i]) && ch[i + 1] === "de" && MESES[ch[i + 2]] != null) {
      const dia = paraNumero(ch[i]);
      if (dia >= 1 && dia <= 31) { data = dataDeDiaMes(dia, MESES[ch[i + 2]]); marcar(i, i + 1, i + 2); }
    }
  }

  // 2) Valores e quantidades
  const dinheiros = [];   // { valor, unitario }
  let qtd = null, unidade = null, qtdFim = null;
  const MARCA_UNITARIO = /^(cada|a unidade|por unidade|o saco|por saco|a saca|o quilo|por quilo|o kg|por kg|o litro|por litro|a caixa|por caixa|a diaria|por diaria|por dia|o dia|a hora|por hora|o metro|por metro|o pacote|a bombona|o galao|a tonelada|a peca|a muda|o pe)\b/;
  for (let i = 0; i < toks.length; i++) {
    if (usado[i] || !ehNumero(ch[i])) continue;
    const valor = paraNumero(ch[i]);
    if (valor == null) continue;
    const seguinte = ch[i + 1] || "";
    const unid = unidadeDe(seguinte);
    const dinheiroAntes = ch[i - 1] === "r$";
    const dinheiroDepois = ehDinheiroPalavra(seguinte);
    if (dinheiroAntes || dinheiroDepois) {
      const contexto = ch.slice(i + (dinheiroDepois ? 2 : 1), i + (dinheiroDepois ? 5 : 4)).join(" ");
      // "2 diárias de 150 reais" / "10 caixas a 60 reais": o valor é por unidade
      const depoisDaQtd = qtd != null && ((ch[i - 1] === "de" && qtdFim === i - 2) || ch[i - 1] === "a");
      dinheiros.push({ valor, unitario: MARCA_UNITARIO.test(contexto) || depoisDaQtd });
      marcar(i);
      if (dinheiroAntes) marcar(i - 1);
      if (dinheiroDepois) marcar(i + 1);
      continue;
    }
    if (unid && qtd == null) { qtd = valor; unidade = unid; qtdFim = i + 1; marcar(i, i + 1); continue; }
    // Número solto: vira valor se ainda não houver nenhum
    if (!unid) {
      const contexto = ch.slice(i + 1, i + 4).join(" ");
      dinheiros.push({ valor, unitario: MARCA_UNITARIO.test(contexto), solto: true });
      marcar(i);
    }
  }

  // Dois valores: se um deles for o outro vezes a quantidade, ele é o total
  let total = null, precoUnit = null;
  if (dinheiros.length >= 2 && qtd > 0) {
    const [a, b] = dinheiros;
    if (Math.abs(a.valor * qtd - b.valor) < 0.02) { precoUnit = a.valor; total = b.valor; }
    else if (Math.abs(b.valor * qtd - a.valor) < 0.02) { precoUnit = b.valor; total = a.valor; }
  }
  if (total == null && precoUnit == null) {
    const un = dinheiros.find(d => d.unitario);
    const outro = dinheiros.find(d => d !== un);
    if (un) { precoUnit = un.valor; if (outro) total = outro.valor; }
    else if (dinheiros.length) total = dinheiros[0].valor;
  }
  if (total == null && precoUnit != null) total = precoUnit * (qtd || 1);
  if (qtd == null && total != null) qtd = 1;
  if (precoUnit == null && total != null && qtd > 0) precoUnit = total / qtd;
  if (total == null) avisos.push("Não entendi o valor — preencha antes de salvar.");

  // 3) Pessoa (trabalhador / comprador) e loja
  const CONECTORES = new Set(["do", "da", "de", "dos", "das", "e"]);
  const SALTAR = new Set(["o", "a", "os", "as", "loja", "seu", "dona", "senhor", "sr", "sra", "do", "da", "de", "dos", "das"]);
  const capturavel = (k) => k < toks.length && !usado[k] && !PARADAS.has(ch[k]) && !CONECTORES.has(ch[k])
    && !ehNumero(ch[k]) && !unidadeDe(ch[k]) && !ehDinheiroPalavra(ch[k]);
  const capturar = (inicio) => {
    const nomes = [];
    let k = inicio;
    while (k < toks.length && nomes.length < 4) {
      if (capturavel(k)) { nomes.push(k); k++; continue; }
      // "Casa do Adubo": o conector só entra se vier outra palavra depois
      if (CONECTORES.has(ch[k]) && nomes.length && capturavel(k + 1)) { nomes.push(k); k++; continue; }
      break;
    }
    return nomes;
  };
  const acharDepoisDe = (marcadores) => {
    for (let i = toks.length - 1; i >= 0; i--) {
      if (usado[i] || !marcadores.includes(ch[i])) continue;
      let ini = i + 1;
      const pulados = [];
      while (ini < toks.length && !usado[ini] && SALTAR.has(ch[ini])) { pulados.push(ini); ini++; }
      const nomes = capturar(ini);
      if (nomes.length) { marcar(i, ...pulados, ...nomes); return nomes.map(k => toks[k]).join(" "); }
    }
    return "";
  };
  const pessoa = acharDepoisDe(["para", "pra", "pro", "ao"]);
  const loja = acharDepoisDe(["na", "no", "em", "loja"]);

  // 4) O que sobrou vira o nome do produto/serviço
  const nome = toks
    .filter((_, i) => !usado[i])
    .filter(t => !RUIDO.has(semAcento(t.toLowerCase())))
    .slice(0, 6)
    .join(" ")
    .trim();
  const titulo = nome ? nome.charAt(0).toUpperCase() + nome.slice(1) : "";

  const base = { qtd: qtd || "", unidade, precoUnit, total, data, pessoa, loja, nome: titulo, frase };
  return { transcricao, destino, avisos, campos: montarCampos(destino, base) };
}

// ─── Monta o lançamento no formato de cada seção do app ─────────────────────
const num = (v) => (v == null || v === "" ? "" : Math.round(Number(v) * 100) / 100);
const UNID_COMPRA = { caixa: "un", ml: "L", diaria: "un", h: "un" };

function montarCampos(destino, b) {
  const obs = "";
  if (destino === "energia") {
    return { date: b.data, month: mesReferencia(b.data), value: num(b.total), kwh: "", notes: obs };
  }
  if (destino === "maodeobra") {
    const dias = b.unidade === "diaria" || b.unidade === "h" ? b.qtd : (b.qtd || 1);
    const valorDia = b.precoUnit != null ? b.precoUnit : (b.total != null && dias ? b.total / dias : "");
    return {
      date: b.data, worker: b.pessoa || b.nome || "", service: b.pessoa ? b.nome : "",
      days: num(dias), dailyRate: num(valorDia), type: "diarista", notes: obs,
    };
  }
  if (destino === "venda") {
    const unidade = b.unidade === "caixa" ? "caixa" : "kg";
    const tipo = /polpa/.test(b.frase) ? "polpa" : /madura/.test(b.frase) ? "madura" : /refugo/.test(b.frase) ? "refugo" : "verde";
    const recebido = /(recebi|ja pagou|pagou|pago|pix caiu|no pix|em dinheiro)/.test(b.frase);
    return {
      date: b.data, type: tipo, buyer: b.pessoa || b.loja || b.nome || "",
      qty: num(b.qtd), unit: unidade, unitPrice: num(b.precoUnit),
      payStatus: recebido ? "recebido" : "a_receber",
      payMethod: /dinheiro|especie/.test(b.frase) ? "dinheiro" : "pix",
      holder: /matheus/.test(b.frase) ? "matheus" : "comigo",
      local: /(na cidade|pra cidade|para a cidade|entregue na cidade)/.test(b.frase) ? "cidade" : "roça",
      entregador: /matheus/.test(b.frase) ? "matheus" : "",
      notes: obs,
    };
  }
  // insumos / materiais
  const unidade = UNID_COMPRA[b.unidade] || b.unidade || "un";
  return {
    type: "compra", date: b.data, name: b.nome || b.loja || "", tipo: palpiteTipo(b.frase),
    counter: b.loja || b.pessoa || "", qty: num(b.qtd), unit: unidade,
    unitPrice: num(b.precoUnit), packSize: unidade === "sc" ? 50 : unidade === "bombona" ? 20 : "",
    nf: "", description: obs,
  };
}

export const DESTINOS = [
  { value: "insumos", label: "Insumos", lista: "inputPurchases" },
  { value: "materiais", label: "Materiais", lista: "materialTransactions" },
  { value: "maodeobra", label: "Mão de Obra", lista: "laborEntries" },
  { value: "energia", label: "Energia", lista: "energyBills" },
  { value: "venda", label: "Venda de Frutas", lista: "fruitSales" },
];
export const destinoInfo = (v) => DESTINOS.find(d => d.value === v) || DESTINOS[0];
// Reaproveita o que já foi entendido quando o usuário troca o destino na mão
export const trocarDestino = (interp, destino) => ({
  ...interp, destino,
  campos: montarCampos(destino, {
    qtd: interp.campos.qty ?? interp.campos.days ?? "",
    unidade: interp.campos.unit || null,
    precoUnit: interp.campos.unitPrice ?? interp.campos.dailyRate ?? null,
    total: totalDe(interp),
    data: interp.campos.date || today(),
    pessoa: interp.campos.worker || interp.campos.buyer || "",
    loja: interp.campos.counter || "",
    nome: interp.campos.name || interp.campos.service || "",
    frase: " " + semAcento(String(interp.transcricao || "").toLowerCase()) + " ",
  }),
});
export const totalDe = (interp) => {
  const c = interp.campos || {};
  if (c.value !== undefined) return Number(c.value || 0);
  if (c.days !== undefined) return Number(c.days || 0) * Number(c.dailyRate || 0);
  return Number(c.qty || 0) * Number(c.unitPrice || 0);
};

export const EXEMPLOS = [
  "Comprei 3 sacos de ureia na Agro Rural por 180 reais cada",
  "Gastei 250 reais de calcário ontem",
  "Paguei 2 diárias de 150 reais para o João",
  "Conta de luz de 840 reais",
  "Vendi 10 caixas de goiaba a 60 reais a caixa para o mercado central",
  "Comprei 20 metros de mangueira na loja do Zé por 300 reais",
];
