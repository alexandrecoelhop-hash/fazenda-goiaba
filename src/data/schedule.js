import { C } from "../ui/theme";

// ─── SCHEDULE TEMPLATE (cronograma a partir da poda / pós-colheita) ──────────
// Ajustado ao manejo do produtor: colheita ~120 dias após a poda,
// adubação de cobertura em 3 momentos, fertirrigação SEMANAL.
// Referência p/ goiaba irrigada no Semiárido — ajustar conforme a cultivar.
export const SCHEDULE_TEMPLATE = (() => {
  const items = [
    { offset: 0, tipo: "poda", titulo: "Poda de produção / frutificação", detalhe: "Marco zero do ciclo. Desinfetar ferramentas de poda.", cor: C.primary },
    { offset: 2, tipo: "fitossanitario", titulo: "Pincelamento de cortes + cúprico", detalhe: "Proteção dos cortes contra bacteriose (produto cúprico).", cor: C.danger },
    { offset: 5, tipo: "adubacao", titulo: "Adubação de cobertura 1/3 (indução de brotação)", detalhe: "1ª de 3 coberturas. N + estímulo de brotação conforme análise de solo.", cor: C.accentDark },
    { offset: 15, tipo: "fitossanitario", titulo: "Monitoramento + controle de psilídeo/ferrugem", detalhe: "Brotações novas: alvo de psilídeo e ferrugem. Aplicar se atingir nível de controle.", cor: C.danger },
    { offset: 40, tipo: "adubacao", titulo: "Adubação de cobertura 2/3 (crescimento/pré-floração)", detalhe: "2ª de 3 coberturas. Reforço N-K conforme fenologia, antes da floração.", cor: C.accentDark },
    { offset: 35, tipo: "fitossanitario", titulo: "Manejo pré-floração", detalhe: "Preventivo antracnose/ferrugem antes da abertura floral.", cor: C.danger },
    { offset: 48, tipo: "outro", titulo: "Floração plena", detalhe: "Cuidado com aplicações — proteger polinizadores. Evitar produtos tóxicos a abelhas.", cor: C.muted },
    { offset: 62, tipo: "outro", titulo: "Raleio / ensacamento de frutos", detalhe: "Raleio p/ padronização + ensacamento contra mosca-das-frutas.", cor: C.primaryLight },
    { offset: 70, tipo: "fitossanitario", titulo: "Manejo de mosca-das-frutas", detalhe: "Iscas tóxicas / monitoramento com armadilhas McPhail.", cor: C.danger },
    { offset: 85, tipo: "adubacao", titulo: "Adubação de cobertura 3/3 (enchimento de frutos)", detalhe: "3ª de 3 coberturas. Manter K e Ca para qualidade e conservação pós-colheita.", cor: C.accentDark },
    { offset: 108, tipo: "fitossanitario", titulo: "Controle pré-colheita (antracnose)", detalhe: "Respeitar carência! Preventivo de podridões. Conferir intervalo de segurança.", cor: C.danger },
    { offset: 120, tipo: "colheita", titulo: "Início da colheita (~120 dias)", detalhe: "Colheita escalonada conforme ponto (verde/maturação).", cor: C.primaryLight },
    { offset: 140, tipo: "poda", titulo: "Pós-colheita: poda de limpeza + adubação de restituição", detalhe: "Retirar ramos secos/doentes, repor nutrientes exportados. Reinicia o próximo ciclo.", cor: C.primary },
  ];
  // Fertirrigação SEMANAL: da brotação (dia 7) até ~1 semana antes da colheita (dia 113)
  for (let d = 7; d <= 113; d += 7) {
    let detalhe = "Fertirrigação semanal — fase vegetativa (foco em N).";
    if (d >= 49 && d < 84) detalhe = "Fertirrigação semanal — frutificação (elevar K para pegamento/enchimento).";
    else if (d >= 84) detalhe = "Fertirrigação semanal — enchimento/maturação (K + Ca, qualidade de fruto).";
    items.push({ offset: d, tipo: "fertirrigacao", titulo: `Fertirrigação semanal (semana ${Math.round(d / 7)})`, detalhe, cor: C.blue });
  }
  return items.sort((a, b) => a.offset - b.offset);
})();
