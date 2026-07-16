// ─── ADUBAÇÃO — TABELAS TÉCNICAS (Natale/FCAV-Unesp; Embrapa) ────────────────
// Referência: Natale et al. (1996a; 2002) — adubação de goiabeira em produção,
// por cultivar, classe de produtividade e análise de solo. Fertirrigação.
// Interpretação P (resina, mg/dm³) e K trocável (mmolc/dm³).
export const P_CLASSES = [
  { key: "muito_baixo", label: "Muito baixo (<6)", min: -Infinity, max: 6 },
  { key: "baixo", label: "Baixo (6–12)", min: 6, max: 12 },
  { key: "medio", label: "Médio (13–30)", min: 12, max: 30 },
  { key: "alto", label: "Alto (>30)", min: 30, max: Infinity },
];
export const K_CLASSES = [
  { key: "muito_baixo", label: "Muito baixo (<0,8)", min: -Infinity, max: 0.8 },
  { key: "baixo", label: "Baixo (0,8–1,5)", min: 0.8, max: 1.5 },
  { key: "medio", label: "Médio (1,6–3,0)", min: 1.5, max: 3.0 },
  { key: "alto", label: "Alto (>3,0)", min: 3.0, max: Infinity },
];
// Doses (g/planta) de N | P2O5[classe P] | K2O[classe K] por classe de produtividade
export const ADUBA_PRODUCAO = {
  Paluma: [
    { classe: "<60 t/ha", N: 1040, P2O5: { muito_baixo: 195, baixo: 130, medio: 70, alto: 0 }, K2O: { muito_baixo: 1040, baixo: 650, medio: 390, alto: 200 } },
    { classe: "60–80 t/ha", N: 1300, P2O5: { muito_baixo: 195, baixo: 130, medio: 70, alto: 0 }, K2O: { muito_baixo: 1430, baixo: 1040, medio: 520, alto: 330 } },
    { classe: "80–100 t/ha", N: 1560, P2O5: { muito_baixo: 260, baixo: 200, medio: 130, alto: 0 }, K2O: { muito_baixo: 1690, baixo: 1240, medio: 780, alto: 460 } },
    { classe: ">100 t/ha", N: 1820, P2O5: { muito_baixo: 325, baixo: 260, medio: 200, alto: 0 }, K2O: { muito_baixo: 1950, baixo: 1500, medio: 1040, alto: 520 } },
  ],
  Rica: [
    { classe: "<40 t/ha", N: 940, P2O5: { muito_baixo: 260, baixo: 200, medio: 70, alto: 0 }, K2O: { muito_baixo: 940, baixo: 620, medio: 310, alto: 160 } },
    { classe: "40–60 t/ha", N: 1040, P2O5: { muito_baixo: 260, baixo: 200, medio: 70, alto: 0 }, K2O: { muito_baixo: 1240, baixo: 910, medio: 460, alto: 260 } },
    { classe: "60–80 t/ha", N: 1300, P2O5: { muito_baixo: 330, baixo: 260, medio: 130, alto: 0 }, K2O: { muito_baixo: 1500, baixo: 1110, medio: 650, alto: 390 } },
    { classe: ">80 t/ha", N: 1560, P2O5: { muito_baixo: 390, baixo: 330, medio: 200, alto: 0 }, K2O: { muito_baixo: 1755, baixo: 1300, medio: 850, alto: 520 } },
  ],
};
// Parcelamento da adubação de produção em fertirrigação (Natale et al.) — % por etapa
export const PARCELAMENTO = [
  { etapa: "Junho/Julho (1 mês antes da poda)", N: 10, P2O5: 100, K2O: 10 },
  { etapa: "Agosto/Setembro", N: 10, P2O5: 0, K2O: 10 },
  { etapa: "Outubro/Novembro", N: 20, P2O5: 0, K2O: 20 },
  { etapa: "Novembro/Dezembro", N: 20, P2O5: 0, K2O: 20 },
  { etapa: "Dezembro/Janeiro", N: 20, P2O5: 0, K2O: 20 },
  { etapa: "Janeiro/Fevereiro", N: 20, P2O5: 0, K2O: 20 },
];
// Teores foliares adequados (g/kg) — 3º par, pleno florescimento (Natale et al. 2002)
export const FOLIAR = {
  Paluma: { N: "20–23", P: "1,4–1,8", K: "14–17", Ca: "7–11", Mg: "3,4–4,0", S: "2,5–3,5" },
  Rica: { N: "22–26", P: "1,5–1,9", K: "17–20", Ca: "11–15", Mg: "2,5–3,5", S: "3,0–3,5" },
};
export const classFor = (classes, v) => classes.find(c => v >= c.min && v < c.max) || classes[0];
// Calagem: NC (t/ha) = (V2 - V1) * CTC / (10 * PRNT), V2 = 70%
export const calcCalagem = (v1, ctc, prnt, prof = 20) => {
  if (!v1 || !ctc || !prnt) return null;
  let nc = ((70 - Number(v1)) * Number(ctc)) / (10 * Number(prnt));
  if (nc < 0) nc = 0;
  if (prof >= 30) nc *= 1.5; // correção p/ 0–30 cm
  return nc;
};
