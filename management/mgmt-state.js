// GESTIÓN: ESTADO, GABINETE, FEDERALISMO Y PARÁMETROS MACROECONÓMICOS
let managementFromCampaign = false;
let selectedInitialSpeech = '';
let mgmt = null;

function createManagementState(fromCampaign = false) {
    mgmt = {
        candidate: fromCampaign ? nombreCandidato : (document.getElementById('input-management-candidate')?.value.trim() || 'Presidente/a'),
        session: 1, 
        maxSessions: 24,
        funds: fromCampaign ? Math.max(100000, fondosPublicos * 4) : 900000,
        gdp: 10000000, 
        debt: 2200000, 
        deficit: 3.2,
        
        // --- SUBSISTEMA CAMBIARIO Y MONETARIO ---
        currency: 1000.0,             // 1 USD = $1.000 Moneda local
        parallelCurrency: 1150.0,     // Dólar financiero / paralelo
        exchangeGap: 15.0,            // Brecha inicial (%)
        interestRate: 45.0,           // Tasa de política monetaria (%)
        monetaryBase: 5000000,        // Base monetaria circulante
        netReserves: 80000,           // Reservas netas en divisa extranjera
        wageIndexation: false,        // Paritarias automáticas por inflación
        
        // --- INDICADORES SOCIOECONÓMICOS ---
        approval: fromCampaign ? Math.max(15, Math.min(85, aprobacionReal)) : 50,
        reputation: fromCampaign ? Math.max(10, Math.min(90, coherenciaDiscursiva)) : 55,
        autonomy: 70, 
        poverty: 25, 
        inequality: 40, 
        foreign: 20, 
        unemployment: 8,
        industry: 52, 
        inflation: 4.0, 
        energy: 72,
        
        // --- POLÍTICA FISCAL Y PRESUPUESTO ---
        wageTax: 20, 
        vat: 21,
        coparticipationRate: 35,      // Porcentaje transferido a provincias
        alloc: { education: 20, health: 20, defense: 10, works: 25, transport: 25 },
        usedSession: false, 
        lastAction: 'Asunción formal del Poder Ejecutivo.', 
        lastCauseText: 'Mandato iniciado bajo orden constitucional.',
        
        // --- GABINETE DE MINISTROS ---
        cabinet: {
            economy: { name: "Dr. Marcelo Aris", profile: "Ortodoxo", competence: 75, loyalty: 70 },
            interior: { name: "Esteban Varela", profile: "Puntero Federal", competence: 65, loyalty: 80 },
            security: { name: "Gral. (R) Rodolfo Benítez", profile: "Mano Dura", competence: 80, loyalty: 65 },
            foreign: { name: "Elena Santillán", profile: "Diplomática de Carrera", competence: 85, loyalty: 75 }
        },

        // --- RELACIÓN CON GOBERNADORES PROVINCIALES ---
        governorsLoyalty: 60,         // Promedio de alineamiento de los 12 distritos
        provincialBondsActive: false, // Cuasimonedas provinciales activas

        // --- CONGRESO DE LA NACIÓN ---
        congress: { 
            deputies: { government: 40, opposition: 52, dialog: 28 }, 
            senate: { government: 18, opposition: 10, dialog: 8 } 
        },

        // --- BANDERAS Y ESTADOS NORMATIVOS ---
        flags: {
            privateMediaBanned: false,
            socialNetworksBanned: false,
            foreignPrivatization: false,
            cepoCambiario: false,
            recursosEstatizados: false,
            priceFreezeActive: false,
            redOficialCreada: false,
            protestasProhibidas: false,
            leyLaboralAprobada: false,
            propiedadPrivadaBlindada: false,
            bancaPrivatizada: false,
            aerolineaPrivatizada: false,
            sovereignDefault: false,
            corralitoActive: false,
            universalSubsidy: false,
            internationalEmbargo: false
        },

        // --- MEDIDORES DE CRISIS TERMINAL Y PRESIÓN OCULTA ---
        hidden: {
            stability: 72, 
            socialTension: 22, 
            laborTension: 18, 
            financialPressure: 18,
            institutionalTrust: 62, 
            militaryLoyalty: 78, 
            serviceQuality: 58, 
            investment: 55,
            polarization: 38, 
            externalPressure: 20, 
            coupRisk: 0,
            
            // Amenazas existenciales directas
            mobPressure: 10,              // Riesgo de asalto a la casa presidencial
            foreignHostility: 15,         // Hostilidad bélica de potencias extranjeras
            internalInsubordination: 5,    // Desobediencia de fuerzas de seguridad
            criticalApprovalTurns: 0      // Turnos continuos con aprobación < 15%
        },
        history: []
    };
}

function recordHistory() {
    if (!mgmt) return;
    mgmt.history.push({
        session: mgmt.session,
        approval: mgmt.approval,
        inflation: mgmt.inflation,
        currency: mgmt.currency,
        poverty: mgmt.poverty,
        gdp: mgmt.gdp / 1000000,
        gap: mgmt.exchangeGap
    });
}

function renderHistoryChart() {
    const svg = document.getElementById('svg-history-chart');
    if (!svg || !mgmt || mgmt.history.length < 2) return;
    svg.innerHTML = '';

    const w = svg.clientWidth || 300;
    const h = svg.clientHeight || 150;
    const maxSessions = 24;
    const pts = mgmt.history;

    function buildPath(dataKey, maxVal, color) {
        let pathD = '';
        pts.forEach((pt, i) => {
            const x = (pt.session / maxSessions) * (w - 30) + 15;
            const y = h - ((pt[dataKey] / maxVal) * (h - 25) + 10);
            pathD += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
        });
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathD);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", color);
        path.setAttribute("stroke-width", "2");
        svg.appendChild(path);
    }

    buildPath('approval', 100, '#10b981');
    buildPath('inflation', 60, '#f59e0b');
    buildPath('currency', Math.max(3000, mgmt.currency * 1.5), '#38bdf8');
    buildPath('poverty', 80, '#ef4444');
}

function renderPermanentControls() {
    if (!mgmt) return;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
        const lbl = document.getElementById(id + '-val');
        if (lbl) lbl.textContent = val + '%';
    };
    setVal('tax-salary', mgmt.wageTax);
    setVal('tax-vat', mgmt.vat);
    Object.keys(mgmt.alloc).forEach(k => setVal('alloc-' + k, mgmt.alloc[k]));

    const total = Object.values(mgmt.alloc).reduce((a, b) => a + b, 0);
    const allocLabel = document.getElementById('allocation-total');
    if (allocLabel) {
        allocLabel.textContent = `Asignación de Gasto: ${total}% ${total === 100 ? '(Equilibrada)' : '(Desbalance)'}`;
        allocLabel.style.color = (total === 100) ? 'var(--accent-green)' : 'var(--accent-gold)';
    }
}

function renderManagement() {
    if (!mgmt) return;
    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
    };

    setTxt('mgmt-name', `Presidencia de ${mgmt.candidate}`);
    const bimestreAnio = ((mgmt.session - 1) % 6) + 1;
    setTxt('mgmt-time', `Bimestre ${mgmt.session} de 24 | Año ${Math.ceil(mgmt.session / 6)} (Bim. ${bimestreAnio})`);
    setTxt('mgmt-funds', money(mgmt.funds));
    setTxt('mgmt-deficit-label', `Déficit: ${mgmt.deficit.toFixed(1)}% | Tasa: ${mgmt.interestRate.toFixed(0)}%`);
    setTxt('mgmt-approval', mgmt.approval.toFixed(1) + '%');

    const barApp = document.getElementById('bar-mgmt-approval');
    if (barApp) barApp.style.width = `${Math.min(100, Math.max(0, mgmt.approval))}%`;

    // Formato dinámico para evitar que muestre $0
    const formatCurrencyVal = (val) => {
        if (!val || val <= 0) return "0.01";
        if (val < 10) return val.toFixed(2);
        return Math.round(val).toLocaleString('es-AR');
    };

    // Visualización cambiaria realista (Pesos por Dólar)
    if (mgmt.flags.cepoCambiario) {
        setTxt('mgmt-currency', `Of: $${formatCurrencyVal(mgmt.currency)} | Blue: $${formatCurrencyVal(mgmt.parallelCurrency)}`);
        setTxt('mgmt-cepo-status', `Brecha: ${mgmt.exchangeGap.toFixed(1)}%`);
    } else {
        setTxt('mgmt-currency', `1 USD = $${formatCurrencyVal(mgmt.currency)}`);
        setTxt('mgmt-cepo-status', "Mercado Libre");
    }

    setTxt('mgmt-gdp', money(mgmt.gdp));
    setTxt('mgmt-autonomy', `${Math.round(mgmt.autonomy)}/100`);
    setTxt('mgmt-poverty', mgmt.poverty.toFixed(1) + '%');
    setTxt('mgmt-inflation', `Inflación: ${mgmt.inflation.toFixed(1)}%`);
    setTxt('mgmt-unemployment', `Desempleo: ${mgmt.unemployment.toFixed(1)}%`);
    setTxt('mgmt-foreign', `Hostilidad Ext.: ${mgmt.hidden.foreignHostility.toFixed(0)}%`);

    setTxt('mgmt-alert-text', mgmt.lastAction || 'Elegí una acción para avanzar el bimestre.');
    const causeEl = document.getElementById('mgmt-alert-cause');
    if (causeEl) {
        causeEl.textContent = mgmt.lastCauseText ? `Consecuencia: ${mgmt.lastCauseText}` : '';
    }

    const dot = document.getElementById('mgmt-status-dot');
    const btnNext = document.getElementById('btn-mgmt-next');
    if (dot && btnNext) {
        dot.className = mgmt.usedSession ? 'status-dot ready' : 'status-dot';
        btnNext.disabled = false;
    }
    renderPermanentControls();
    renderHistoryChart();
}

function startManagement(fromCampaign = false) {
    managementFromCampaign = fromCampaign;
    createManagementState(fromCampaign);
    recordHistory();

    if (!fromCampaign) {
        const speech = selectedInitialSpeech || 'silencio';
        const effects = {
            vida: { approval: 4, poverty: -1, msg: 'Discurso de bienestar: Alta expectativa en gasto social.', cause: 'Priorizaste las urgencias inmediatas.' },
            culpables: { approval: 2, autonomy: 2, msg: 'Discurso de confrontación: Polarización abierta.', cause: 'Culpaste a la gestión anterior.' },
            seguridad: { approval: 1, autonomy: 1, msg: 'Discurso de orden: Respaldo de fuerzas armadas.', cause: 'Marcaste autoridad estatal inmediata.' },
            economia: { approval: 4, inflation: -0.4, msg: 'Discurso de solvencia: Calma momentánea en mercados.', cause: 'Prometiste equilibrio en cuentas.' },
            cambio: { approval: 3, msg: 'Promesa de reforma institucional de fondo.', cause: 'Alta expectativa ciudadana de giro radical.' },
            silencio: { approval: rnd.float(-2, 1), msg: 'Silencio oficial: Desconcierto generalizado.', cause: 'Evitaste compromisos programáticos.' }
        }[speech] || { approval: 0, msg: 'Gestión iniciada sin mensaje inaugural.', cause: '' };
        mgmt.approval += effects.approval || 0;
        mgmt.lastAction = effects.msg;
        mgmt.lastCauseText = effects.cause;
    }
    showScreen('management');
    renderManagement();
    if (typeof renderManagementActions === 'function') {
        renderManagementActions('gestion');
    }
}

// Escuchadores de interfaz para selección de discurso inicial
document.querySelectorAll('.mgmt-speech').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.mgmt-speech').forEach(x => {
        x.classList.remove('selected');
        x.style.borderColor = 'var(--card-border)';
    });
    btn.classList.add('selected');
    btn.style.borderColor = 'var(--accent-gold)';
    selectedInitialSpeech = btn.dataset.speech;
}));

safeOn('btn-management-start', 'click', () => {
    if (!selectedInitialSpeech) selectedInitialSpeech = 'silencio';
    startManagement(false);
});
safeOn('btn-management-back', 'click', () => showScreen('home'));

safeOn('fiscal-accordion-toggle', 'click', () => {
    const body = document.getElementById('fiscal-accordion-body');
    const arrow = document.getElementById('fiscal-accordion-arrow');
    if (body.style.display === 'flex') {
        body.style.display = 'none';
        arrow.textContent = '▼';
    } else {
        body.style.display = 'flex';
        arrow.textContent = '▲';
    }
});

// Permite abrir la reconversión monetaria haciendo clic directo sobre la moneda en el HUD
safeOn('mgmt-currency', 'click', () => {
    if (typeof openCurrencyReconversionModal === 'function') {
        openCurrencyReconversionModal();
    }
});
