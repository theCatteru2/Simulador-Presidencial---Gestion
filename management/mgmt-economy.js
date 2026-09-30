// GESTIÓN: MOTOR MACROECONÓMICO INTERCONECTADO
const mgmtSliderMap = {
    'tax-salary': 'wageTax', 
    'tax-vat': 'vat', 
    'alloc-education': 'education',
    'alloc-health': 'health', 
    'alloc-defense': 'defense', 
    'alloc-works': 'works', 
    'alloc-transport': 'transport'
};

Object.entries(mgmtSliderMap).forEach(([id, key]) => {
    safeOn(id, 'input', e => {
        if (!mgmt) return;
        if (key === 'wageTax') mgmt.wageTax = +e.target.value;
        else if (key === 'vat') mgmt.vat = +e.target.value;
        else mgmt.alloc[key] = +e.target.value;
        renderPermanentControls();
    });
});

function applyEconomyTick() {
    const a = mgmt.alloc;
    const totalAlloc = Object.values(a).reduce((x, y) => x + y, 0);
    const h = mgmt.hidden;
    const f = mgmt.flags;

    // 1. INGRESOS FISCALES (Recaudación afectada por actividad y evasión)
    const baseTaxRatio = 0.038 + (mgmt.vat * 0.0028) + (mgmt.wageTax * 0.0019);
    const revenue = mgmt.gdp * baseTaxRatio * (1 - (h.socialTension * 0.0015));

    // 2. GASTO FISCAL (Impactado por subsidios, indexación salarial y transferencias)
    let spendingRatio = 0.090 + (totalAlloc * 0.00048);
    if (f.universalSubsidy) spendingRatio *= 1.35; // Subsidio general encarece las partidas
    if (mgmt.wageIndexation && mgmt.inflation > 6) {
        spendingRatio *= (1 + (mgmt.inflation * 0.012)); // Espiral de salarios públicos indexados
    }

    const spending = mgmt.gdp * spendingRatio * multiplicadorGasto;
    
    // Costo financiero de la deuda soberana
    const interest = f.sovereignDefault ? 0 : mgmt.debt * (0.0040 + Math.max(0, mgmt.inflation - 4) * 0.0003);
    const fiscalGap = spending + interest - revenue;

    mgmt.deficit = clamp((fiscalGap / mgmt.gdp) * 100, -8, 22);
    mgmt.funds += revenue - spending - interest;

    // 3. EMISIÓN MONETARIA Y FINANCIAMIENTO DEL DÉFICIT
    if (fiscalGap > 0) {
        if (!f.sovereignDefault) {
            mgmt.debt += fiscalGap * 0.45;
        }
        // Emisión endógena para cubrir el remanente
        const printing = fiscalGap * (f.sovereignDefault ? 0.95 : 0.55);
        mgmt.monetaryBase += printing;
        h.financialPressure += Math.min(4.0, (fiscalGap / mgmt.gdp) * 100 * 0.6);
    } else {
        mgmt.debt = Math.max(0, mgmt.debt + fiscalGap * 0.30);
        h.financialPressure = Math.max(0, h.financialPressure - 1.5);
    }

    // 4. DINÁMICA CAMBIARIA Y RESERVAS
if (f.cepoCambiario) {
    // La emisión y la desconfianza disparan el dólar paralelo
    const printingPressure = (mgmt.monetaryBase / 5000000) * 0.035;
    mgmt.parallelCurrency *= (1 + printingPressure + (h.financialPressure * 0.002));
    mgmt.exchangeGap = ((mgmt.parallelCurrency - mgmt.currency) / mgmt.currency) * 100;
    
    // Fuga de reservas si la brecha es insostenible
    if (mgmt.exchangeGap > 40) {
        mgmt.netReserves = Math.max(0, mgmt.netReserves - 10000);
        h.investment = Math.max(5, h.investment - 2);
    }
} else {
    // Mercado libre: el dólar oficial sube según déficit y presión financiera
    const devalRate = (mgmt.deficit > 2 ? (mgmt.deficit - 2) * 0.018 : 0) + (h.financialPressure * 0.0025);
    mgmt.currency *= (1 + devalRate);
    mgmt.parallelCurrency = mgmt.currency;
    mgmt.exchangeGap = 0;
}

// 5. INFLACIÓN
// Presión por salto cambiario porcentual
const rateCooling = Math.max(0, (mgmt.interestRate - 40) * 0.06);
const devalShock = (mgmt.deficit * 0.08) + (h.financialPressure * 0.05);

let inflationDelta = devalShock - rateCooling;
if (f.priceFreezeActive) inflationDelta *= 0.35;
mgmt.inflation = clamp(mgmt.inflation + inflationDelta, 0.5, 140);

    // 6. ACTIVIDAD ECONÓMICA Y DESEMPLEO (Impacto de tasas e inversión)
    const rateCreditSqueeze = Math.max(0, (mgmt.interestRate - 55) * 0.0004);
    const growth = 0.0015 - rateCreditSqueeze + (h.investment * 0.000015) - (mgmt.inflation * 0.00009);
    mgmt.gdp *= clamp(1 + growth, 0.96, 1.03);

    mgmt.unemployment += (mgmt.gdp < 10000000 ? 0.18 : -0.08) + (rateCreditSqueeze * 40);
    mgmt.unemployment = clamp(mgmt.unemployment, 2, 42);

    // 7. POBREZA Y BIENESTAR
    const socialSpend = (a.education + a.health) / 40;
    mgmt.poverty += (mgmt.inflation * 0.045) + (mgmt.unemployment * 0.08) - (socialSpend * 0.12);
    if (f.corralitoActive) mgmt.poverty += 4.0; // Pérdida directa de poder adquisitivo
    mgmt.poverty = clamp(mgmt.poverty, 4, 90);

    // 8. TENSIONES SOCIALES Y RIESGO DE ESTALLIDO
    h.socialTension = clamp(h.socialTension + (mgmt.poverty - 25) * 0.05 + (mgmt.inflation - 5) * 0.06 - socialSpend * 0.25, 0, 100);
    h.laborTension = clamp(h.laborTension + (mgmt.unemployment - 8) * 0.06 + (mgmt.inflation - 5) * 0.05, 0, 100);

    // Presión popular sobre la casa de gobierno
    h.mobPressure = clamp((mgmt.poverty * 0.45) + (h.socialTension * 0.45) + (100 - mgmt.approval) * 0.30, 0, 100);

    // Aprobación ciudadana
    const livingStandard = 50 - mgmt.poverty - (mgmt.unemployment * 0.9) - (mgmt.inflation * 0.4);
    const targetApproval = clamp(25 + livingStandard * 0.40, 3, 95);
    mgmt.approval = clamp(mgmt.approval + (targetApproval - mgmt.approval) * 0.16, 2, 98);

    if (mgmt.approval < 15) {
        h.criticalApprovalTurns++;
    } else {
        h.criticalApprovalTurns = Math.max(0, h.criticalApprovalTurns - 1);
    }
}