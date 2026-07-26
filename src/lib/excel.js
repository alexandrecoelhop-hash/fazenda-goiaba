import * as XLSX from "xlsx";
import { today } from "./format";
import { saleKg, buyerSummary, CAIXA_KG } from "./sales";
import { workerSummary, counterSummary } from "./registros";

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
export function exportToExcel(data) {
  const wb = XLSX.utils.book_new();
  const sheet = (name, rows) => {
    if (!rows || rows.length === 0) rows = [{ Aviso: "Sem registros" }];
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  };

  // Resumo financeiro (inclui o custo por kg atualizado)
  const receita = data.fruitSales.reduce((s, x) => s + Number(x.total || 0), 0);
  const insumos = data.inputPurchases.filter(x => x.type === "compra").reduce((s, x) => s + Number(x.total || 0), 0);
  const labor = data.laborEntries.reduce((s, x) => s + Number(x.total || 0), 0);
  const energy = data.energyBills.reduce((s, x) => s + Number(x.value || 0), 0);
  const materials = data.materialTransactions.filter(x => x.type === "compra").reduce((s, x) => s + Number(x.total || 0), 0);
  const totalCusto = insumos + labor + energy + materials;
  const totalKg = data.fruitSales.reduce((s, x) => s + saleKg(x), 0);
  const rnd = (v) => Math.round(v * 100) / 100;
  const perKg = (v) => (totalKg > 0 ? rnd(v / totalKg) : 0);
  sheet("Resumo", [
    { Indicador: "Receita com frutas (R$)", Valor: rnd(receita) },
    { Indicador: "Custo total (R$)", Valor: rnd(totalCusto) },
    { Indicador: "Resultado (R$)", Valor: rnd(receita - totalCusto) },
    { Indicador: "Produção vendida (kg)", Valor: rnd(totalKg) },
    { Indicador: "Custo por kg (R$/kg)", Valor: perKg(totalCusto) },
    { Indicador: "Preço médio recebido (R$/kg)", Valor: perKg(receita) },
    { Indicador: "Resultado por kg (R$/kg)", Valor: perKg(receita - totalCusto) },
    { Indicador: `Custo por caixa de ${CAIXA_KG} kg (R$)`, Valor: rnd(perKg(totalCusto) * CAIXA_KG) },
    { Indicador: "  Insumos por kg (R$/kg)", Valor: perKg(insumos) },
    { Indicador: "  Mão de obra por kg (R$/kg)", Valor: perKg(labor) },
    { Indicador: "  Energia por kg (R$/kg)", Valor: perKg(energy) },
    { Indicador: "  Materiais por kg (R$/kg)", Valor: perKg(materials) },
  ]);
  sheet("Estoque", data.stockItems.map(s => ({ Produto: s.name, Categoria: s.category, Quantidade: s.qty, Unidade: s.unit, "Estoque Min": s.minQty })));
  sheet("Insumos", data.inputPurchases.map(x => ({ Operacao: x.type, Data: x.date, Produto: x.name, "Tipo produto": x.tipo || "", Descricao: x.description, Contraparte: x.counter, Qtd: x.qty, Unid: x.unit, "Preco Unit": x.unitPrice, Total: x.total, NF: x.nf })));
  sheet("Materiais", data.materialTransactions.map(x => ({ Operacao: x.type, Data: x.date, Material: x.name, "Tipo produto": x.tipo || "", Descricao: x.description, Contraparte: x.counter, Qtd: x.qty, Unid: x.unit, "Preco Unit": x.unitPrice, Total: x.total, NF: x.nf })));
  sheet("Mao de Obra", data.laborEntries.map(x => ({ Data: x.date, Trabalhador: x.worker, Servico: x.service, Tipo: x.type, "Dias/Qtd": x.days, "Valor Unit": x.dailyRate, Total: x.total, Obs: x.notes })));
  sheet("Energia", data.energyBills.map(x => ({ Referencia: x.month, Vencimento: x.date, kWh: x.kwh, Valor: x.value, Obs: x.notes })));
  sheet("Venda Frutas", data.fruitSales.map(x => ({ Data: x.date, Produto: x.type, Comprador: x.buyer, Qtd: x.qty, Unid: x.unit, Kg: saleKg(x), "Preco Unit": x.unitPrice, Total: x.total, Situacao: x.payStatus === "recebido" ? "recebido" : "a receber", Forma: x.payMethod || "", "Dinheiro com": x.holder || "" })));
  sheet("Manejo", data.agronomicEvents.map(x => ({ Data: x.date, Tipo: x.type, Valvula: x.talhao, Descricao: x.title, Produto: x.product, "Dose/Lamina": x.dose, "Area ha": x.area, Proxima: x.nextDate, Obs: x.notes })));
  sheet("Aplicacoes", data.applications.map(x => ({ Data: x.date, Valvula: x.talhao, Alvo: x.target, "Produto Comercial": x.product, "Ingrediente Ativo": x.active, Dose: x.dose, Volume: x.volume, "Carencia dias": x.carencia, "Reentrada h": x.reentry, Responsavel: x.applicator, Obs: x.notes })));
  sheet("Compradores", buyerSummary(data.fruitSales).map(x => ({ Comprador: x.nome, Caixas: x.caixas, "Kg total": x.kg, "Comprou R$": x.total, "A receber R$": x.aReceber })));
  sheet("Trabalhadores", workerSummary(data.laborEntries).map(x => ({ Trabalhador: x.nome, Tipo: x.tipos, Servicos: x.servicos, "Dias/Qtd": x.dias, "Total pago R$": x.total, "Ultimo dia": x.ultima })));
  sheet("Fornecedores", counterSummary(data.inputPurchases, "compra").map(x => ({ Loja: x.nome, Produtos: x.produtos, Compras: x.compras, "Total gasto R$": x.total, Ultima: x.ultima })));
  sheet("Valvulas", data.plots.map(x => ({ Nome: x.name, Variedade: x.variety, "Area ha": x.area, Plantas: x.plantCount, "Ano Plantio": x.plantYear, Irrigacao: x.irrigation, Estagio: x.stage })));
  XLSX.writeFile(wb, `Fazenda_Goiaba_${today()}.xlsx`);
}
