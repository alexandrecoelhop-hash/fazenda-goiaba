// Leitura de nota fiscal (XML da NF-e ou PDF/DANFE) para importar itens.
// Tudo é processado no próprio navegador — o arquivo não sai do aparelho.
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const num = (v) => {
  if (v == null) return 0;
  const s = String(v).trim().replace(/\s/g, "");
  // "1.234,56" (br) vs "1234.56" (xml)
  const br = /,\d{1,4}$/.test(s);
  return Number(br ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "")) || 0;
};

// ─── XML da NF-e: leitura exata ──────────────────────────────────────────────
export function lerXmlNfe(texto) {
  const doc = new DOMParser().parseFromString(texto, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("Arquivo XML inválido.");
  const tag = (el, nome) => el?.getElementsByTagName(nome)?.[0]?.textContent?.trim() || "";
  const emit = doc.getElementsByTagName("emit")[0];
  const ide = doc.getElementsByTagName("ide")[0];
  const itens = [...doc.getElementsByTagName("det")].map((det, i) => {
    const p = det.getElementsByTagName("prod")[0];
    return {
      id: `x${i}`,
      nome: tag(p, "xProd"),
      unidade: (tag(p, "uCom") || "un").toLowerCase(),
      qtd: num(tag(p, "qCom")),
      valorUnit: num(tag(p, "vUnCom")),
      total: num(tag(p, "vProd")),
    };
  });
  if (!itens.length) throw new Error("Não encontrei produtos neste XML.");
  return {
    origem: "XML da NF-e",
    loja: tag(emit, "xNome") || tag(emit, "xFant"),
    numero: tag(ide, "nNF"),
    data: (tag(ide, "dhEmi") || tag(ide, "dEmi")).slice(0, 10),
    itens,
  };
}

// ─── PDF (DANFE): extrai o texto e tenta identificar as linhas de produto ────
async function textoDoPdf(arrayBuffer) {
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const linhas = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // agrupa os pedaços de texto por altura (mesma linha visual)
    const porLinha = new Map();
    content.items.forEach(it => {
      const y = Math.round(it.transform[5]);
      const chave = [...porLinha.keys()].find(k => Math.abs(k - y) <= 3) ?? y;
      const atual = porLinha.get(chave) || [];
      atual.push({ x: it.transform[4], s: it.str });
      porLinha.set(chave, atual);
    });
    [...porLinha.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, pedacos]) => linhas.push(pedacos.sort((a, b) => a.x - b.x).map(t => t.s).join(" ").replace(/\s+/g, " ").trim()));
  }
  return linhas.filter(Boolean);
}

// Linha de produto da DANFE termina com números: ... UN QTD VL.UNIT VL.TOTAL ...
const RE_ITEM = /^(.*?)\s+([A-Za-zçÇ]{1,6})\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)(?:\s|$)/;
const UNIDADES = ["un", "und", "unid", "kg", "sc", "lt", "l", "ml", "cx", "pc", "pct", "sac", "g", "mt", "m", "rl", "fd", "bd", "gl", "to", "ton"];

export async function lerPdfNota(arrayBuffer) {
  const linhas = await textoDoPdf(arrayBuffer);
  const itens = [];
  linhas.forEach((linha, i) => {
    const m = linha.match(RE_ITEM);
    if (!m) return;
    let [, desc, unidade, qtd, vUnit, vTotal] = m;
    if (!UNIDADES.includes(unidade.toLowerCase())) return;
    // tira código do produto e NCM/CFOP do começo da descrição
    desc = desc.replace(/^\s*\d{3,}\s+/, "").replace(/\s+\d{8}\s+\d{0,4}\s*\d{0,4}\s*$/, "").replace(/\s+\d{4,8}$/g, "").trim();
    const q = num(qtd), vu = num(vUnit), vt = num(vTotal);
    if (!desc || desc.length < 3 || q <= 0 || vt <= 0) return;
    // confere se as contas fecham (evita pegar linha de imposto/total)
    if (Math.abs(q * vu - vt) > Math.max(0.05, vt * 0.02)) return;
    itens.push({ id: `p${i}`, nome: desc.slice(0, 60), unidade: unidade.toLowerCase(), qtd: q, valorUnit: vu, total: vt });
  });
  if (!itens.length) throw new Error("Não consegui identificar os produtos neste PDF. Você pode lançar os itens manualmente em Insumos, ou tentar com o arquivo XML da nota.");

  const texto = linhas.join(" ");
  const loja = (linhas.find(l => /LTDA|ME\b|EIRELI|S\/A|S\.A|COMERCIO|AGRO/i.test(l)) || "").slice(0, 60);
  const numero = (texto.match(/N[ºo°]\.?\s*0*([\d.]{3,})/i) || [])[1] || "";
  const data = (texto.match(/(\d{2})\/(\d{2})\/(\d{4})/) || []).slice(1);
  return {
    origem: "PDF da nota",
    loja: loja.trim(),
    numero: numero.replace(/\./g, ""),
    data: data.length ? `${data[2]}-${data[1]}-${data[0]}` : "",
    itens,
  };
}

export async function lerNota(file) {
  const nome = file.name.toLowerCase();
  if (nome.endsWith(".xml")) return lerXmlNfe(await file.text());
  if (nome.endsWith(".pdf")) return lerPdfNota(await file.arrayBuffer());
  throw new Error("Envie o PDF ou o XML da nota fiscal.");
}
