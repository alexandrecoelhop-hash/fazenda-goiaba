import * as XLSX from "xlsx";
import { today } from "./format";

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
export function exportToExcel(data) {
  const wb = XLSX.utils.book_new();
  const sheet = (name, rows) => {
    if (!rows || rows.length === 0) rows = [{ Aviso: "Sem registros" }];
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  };
  sheet("Estoque", data.stockItems.map(s => ({ Produto: s.name, Categoria: s.category, Quantidade: s.qty, Unidade: s.unit, "Estoque Min": s.minQty })));
  sheet("Insumos", data.inputPurchases.map(x => ({ Tipo: x.type, Data: x.date, Produto: x.name, Contraparte: x.counter, Qtd: x.qty, Unid: x.unit, "Preco Unit": x.unitPrice, Total: x.total, NF: x.nf })));
  sheet("Materiais", data.materialTransactions.map(x => ({ Tipo: x.type, Data: x.date, Material: x.name, Descricao: x.description, Contraparte: x.counter, Qtd: x.qty, Unid: x.unit, "Preco Unit": x.unitPrice, Total: x.total, NF: x.nf })));
  sheet("Mao de Obra", data.laborEntries.map(x => ({ Data: x.date, Trabalhador: x.worker, Servico: x.service, Tipo: x.type, "Dias/Qtd": x.days, "Valor Unit": x.dailyRate, Total: x.total, Obs: x.notes })));
  sheet("Energia", data.energyBills.map(x => ({ Referencia: x.month, Vencimento: x.date, kWh: x.kwh, Valor: x.value, Obs: x.notes })));
  sheet("Venda Frutas", data.fruitSales.map(x => ({ Data: x.date, Produto: x.type, Comprador: x.buyer, Qtd: x.qty, Unid: x.unit, "Preco Unit": x.unitPrice, Total: x.total, NF: x.nf })));
  sheet("Manejo", data.agronomicEvents.map(x => ({ Data: x.date, Tipo: x.type, Talhao: x.talhao, Descricao: x.title, Produto: x.product, "Dose/Lamina": x.dose, "Area ha": x.area, Proxima: x.nextDate, Obs: x.notes })));
  sheet("Aplicacoes", data.applications.map(x => ({ Data: x.date, Talhao: x.talhao, Alvo: x.target, "Produto Comercial": x.product, "Ingrediente Ativo": x.active, Dose: x.dose, Volume: x.volume, "Carencia dias": x.carencia, "Reentrada h": x.reentry, Responsavel: x.applicator, Obs: x.notes })));
  sheet("Talhoes", data.plots.map(x => ({ Nome: x.name, Variedade: x.variety, "Area ha": x.area, Plantas: x.plantCount, "Ano Plantio": x.plantYear, Irrigacao: x.irrigation, Estagio: x.stage })));
  XLSX.writeFile(wb, `Fazenda_Goiaba_${today()}.xlsx`);
}
