// GESTIÓN: MOTOR DE ELECCIONES DISTRITALES, BALOTAJE, REPORTE FINAL Y AVANCE

// 1. ELECCIONES DE MEDIO TÉRMINO CON ESCRUTINIO ANIMADO
function runMidtermElection() {
    showScreen('midterms-view');
    const grid = document.getElementById('midterms-districts-grid');
    const resBox = document.getElementById('midterms-resolution-card');
    const btnContinue = document.getElementById('btn-midterms-continue');

    if (!grid || !resBox || !btnContinue) return;
    grid.innerHTML = '';
    btnContinue.style.display = 'none';
    
    // Panel superior de transmisión oficial
    resBox.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.8rem; font-weight:800; color:var(--accent-gold);">CENTRO NACIONAL DE CÓMPUTOS</span>
                <span id="midterms-progress-label" style="font-size:0.75rem; color:var(--text-dim);">Escrutando: 0%</span>
            </div>
            <div class="bar-container" style="height:10px; background:#0f172a; border-radius:5px; overflow:hidden;">
                <div id="bar-midterms-gov" style="height:100%; width:0%; background:${PARTY_COLORS.government}; float:left; transition:width 0.2s;"></div>
                <div id="bar-midterms-dial" style="height:100%; width:0%; background:${PARTY_COLORS.dialog}; float:left; transition:width 0.2s;"></div>
                <div id="bar-midterms-opp" style="height:100%; width:0%; background:${PARTY_COLORS.opposition}; float:left; transition:width 0.2s;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:700;">
                <span style="color:${PARTY_COLORS.government};" id="lbl-mid-gov">Oficialismo: 0.0%</span>
                <span style="color:${PARTY_COLORS.dialog};" id="lbl-mid-dial">Dialogistas: 0.0%</span>
                <span style="color:${PARTY_COLORS.opposition};" id="lbl-mid-opp">Oposición: 0.0%</span>
            </div>
        </div>
    `;

    let totalRulingWeighted = 0;
    let totalDialogWeighted = 0;
    let totalOppWeighted = 0;
    let districtResults = [];

    const economicHealth = clamp(50 - (mgmt.poverty * 0.4) - (mgmt.inflation * 0.35) - (mgmt.unemployment * 0.5), 5, 95);
    const institutionalScore = clamp((mgmt.approval * 0.6) + (economicHealth * 0.4), 8, 92);

    DISTRITOS_FEDERALES.forEach(dist => {
        let localBonus = rnd.float(-5.0, 5.0);
        if (dist.name.includes("Minero") && mgmt.flags.recursosEstatizados) localBonus += 4;
        if (dist.name.includes("Capital") && mgmt.alloc.transport >= 25) localBonus += 3;
        if (dist.name.includes("del Campo") && mgmt.flags.cepoCambiario) localBonus -= 6;
        if (mgmt.provincialBondsActive) localBonus -= 5;

        const govDist = clamp(institutionalScore + localBonus, 10.0, 85.0);
        const rem = 100 - govDist;
        const dialogDist = clamp(rem * rnd.float(0.25, 0.40), 5.0, 35.0);
        const oppDist = clamp(100 - govDist - dialogDist, 5.0, 80.0);

        totalRulingWeighted += govDist * (dist.weight / 100);
        totalDialogWeighted += dialogDist * (dist.weight / 100);
        totalOppWeighted += oppDist * (dist.weight / 100);

        let ganador = "Oficialismo";
        let colorGanador = PARTY_COLORS.government;
        if (oppDist > govDist && oppDist > dialogDist) {
            ganador = "Oposición";
            colorGanador = PARTY_COLORS.opposition;
        } else if (dialogDist > govDist && dialogDist > oppDist) {
            ganador = "Dialogistas";
            colorGanador = PARTY_COLORS.dialog;
        }

        districtResults.push({
            name: dist.name,
            weight: dist.weight,
            govDist,
            dialogDist,
            oppDist,
            ganador,
            colorGanador
        });
    });

    let pct = 0;
    const interval = setInterval(() => {
        pct += 20;
        const curGov = (totalRulingWeighted * (pct / 100)).toFixed(1);
        const curDial = (totalDialogWeighted * (pct / 100)).toFixed(1);
        const curOpp = (totalOppWeighted * (pct / 100)).toFixed(1);

        const lblProg = document.getElementById('midterms-progress-label');
        if (lblProg) lblProg.textContent = `Mesas Escrutadas: ${pct}%`;
        
        const bGov = document.getElementById('bar-midterms-gov');
        const bDial = document.getElementById('bar-midterms-dial');
        const bOpp = document.getElementById('bar-midterms-opp');
        if (bGov) bGov.style.width = `${curGov}%`;
        if (bDial) bDial.style.width = `${curDial}%`;
        if (bOpp) bOpp.style.width = `${curOpp}%`;

        const lGov = document.getElementById('lbl-mid-gov');
        const lDial = document.getElementById('lbl-mid-dial');
        const lOpp = document.getElementById('lbl-mid-opp');
        if (lGov) lGov.textContent = `Oficialismo: ${curGov}%`;
        if (lDial) lDial.textContent = `Dialogistas: ${curDial}%`;
        if (lOpp) lOpp.textContent = `Oposición: ${curOpp}%`;

        if (pct >= 100) {
            clearInterval(interval);
            renderMidtermResults(totalRulingWeighted, totalDialogWeighted, totalOppWeighted, districtResults);
        }
    }, 140);
}

function renderMidtermResults(totalRulingWeighted, totalDialogWeighted, totalOppWeighted, districtResults) {
    const grid = document.getElementById('midterms-districts-grid');
    const resBox = document.getElementById('midterms-resolution-card');
    const btnContinue = document.getElementById('btn-midterms-continue');

    grid.innerHTML = '';
    districtResults.forEach(d => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = `4px solid ${d.colorGanador}`;
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:0.75rem;">${d.name}</strong>
                <span style="font-size:0.68rem; font-weight:800; color:${d.colorGanador}; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">
                    ${d.ganador}
                </span>
            </div>
            <div style="margin-top:6px; display:flex; flex-direction:column; gap:2px; font-size:0.72rem;">
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:${PARTY_COLORS.government}; font-weight:700;">Oficialismo:</span>
                    <span>${d.govDist.toFixed(1)}%</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:${PARTY_COLORS.dialog};">Dialogistas:</span>
                    <span>${d.dialogDist.toFixed(1)}%</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:${PARTY_COLORS.opposition}; font-weight:700;">Oposición:</span>
                    <span>${d.oppDist.toFixed(1)}%</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    const seatsGov = clamp(Math.round(120 * (totalRulingWeighted / 100)), 15, 85);
    const remainingSeats = 120 - seatsGov;
    const seatsDialog = clamp(Math.round(remainingSeats * 0.35), 8, Math.max(8, remainingSeats - 8));
    const seatsOpp = 120 - seatsGov - seatsDialog;

    const delta = seatsGov - mgmt.congress.deputies.government;
    mgmt.congress.deputies.government = seatsGov;
    mgmt.congress.deputies.dialog = seatsDialog;
    mgmt.congress.deputies.opposition = seatsOpp;

    const senateGain = totalRulingWeighted >= 45 ? 3 : totalRulingWeighted >= 35 ? 0 : -3;
    mgmt.congress.senate.government = clamp(mgmt.congress.senate.government + senateGain, 8, 24);
    mgmt.congress.senate.opposition = clamp(36 - mgmt.congress.senate.government - 8, 8, 22);

    resBox.innerHTML += `
        <div style="margin-top:10px; padding-top:8px; border-top:1px solid var(--card-border);">
            <h4 style="color:${delta >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size:0.9rem; margin-bottom:4px;">
                ${delta >= 0 ? '¡TRIUNFO LEGISLATIVO DEL OFICIALISMO!' : 'RETROCESO EN LA CÁMARA DE DIPUTADOS'}
            </h4>
            <p style="font-size:0.78rem;">Promedio Nacional: <strong>Oficialismo ${totalRulingWeighted.toFixed(1)}%</strong> | Oposición ${totalOppWeighted.toFixed(1)}% | Dialogistas ${totalDialogWeighted.toFixed(1)}%.</p>
            <p style="font-size:0.78rem; margin-top:2px;">
                Nueva conformación de Diputados (120): <strong>${seatsGov} Oficialistas</strong> (${delta >= 0 ? '+' : ''}${delta}), ${seatsDialog} Dialogistas y ${seatsOpp} Opositores.
            </p>
        </div>
    `;

    btnContinue.style.display = 'block';
    btnContinue.onclick = () => {
        mgmt.session = 13;
        mgmt.usedSession = false;
        mgmt.lastAction = `Elecciones Legislativas concluidas. Oficialismo obtuvo ${totalRulingWeighted.toFixed(1)}% nacional.`;
        mgmt.lastCauseText = `La composición de Diputados se fijó en ${seatsGov} bancas.`;
        showScreen('management');
        renderManagement();
        renderManagementActions('gestion');
    };
}

// 2. ELECCIÓN PRESIDENCIAL GENERAL (AÑO 4 / BIMESTRE 24)
function runPresidentialElection() {
    showScreen('presidential-view');

    const bar = document.getElementById('bar-pres-election');
    const grid = document.getElementById('pres-districts-grid');
    const resCard = document.getElementById('pres-resolution-card');
    const btnAct = document.getElementById('btn-pres-action');
    const subTitle = document.getElementById('pres-election-subtitle');

    if (subTitle) subTitle.textContent = "Resultados oficiales en los 12 Distritos Federales de la República";
    if (bar) bar.style.width = '0%';
    if (grid) grid.innerHTML = '';
    if (resCard) resCard.innerHTML = '';
    if (btnAct) btnAct.style.display = 'none';

    let totalGov = 0;
    let totalOpp = 0;
    let totalDialog = 0;
    let districtResults = [];

    const living = 50 - (mgmt.poverty * 0.45) - (mgmt.inflation * 0.35) - (mgmt.unemployment * 0.4);
    const baseGov = clamp((mgmt.approval * 0.55) + (living * 0.30) + ((mgmt.reputation / 2) * 0.15), 10, 85);

    DISTRITOS_FEDERALES.forEach(dist => {
        const vNoise = rnd.float(-5.5, 5.5);
        const govPct = clamp(baseGov + vNoise, 8.0, 80.0);
        const remaining = 100 - govPct;
        const dialogPct = clamp(remaining * rnd.float(0.25, 0.40), 5.0, 32.0);
        const oppPct = clamp(100 - govPct - dialogPct, 8.0, 80.0);

        totalGov += govPct * (dist.weight / 100);
        totalOpp += oppPct * (dist.weight / 100);
        totalDialog += dialogPct * (dist.weight / 100);

        let ganador = "Oficialismo";
        let colorGanador = PARTY_COLORS.government;
        if (oppPct > govPct && oppPct > dialogPct) {
            ganador = "Oposición";
            colorGanador = PARTY_COLORS.opposition;
        } else if (dialogPct > govPct && dialogPct > oppPct) {
            ganador = "Dialogistas";
            colorGanador = PARTY_COLORS.dialog;
        }

        districtResults.push({
            name: dist.name,
            govPct,
            oppPct,
            dialogPct,
            ganador,
            colorGanador
        });
    });

    let pct = 0;
    const interval = setInterval(() => {
        pct += 25;
        if (bar) bar.style.width = `${pct}%`;
        if (pct >= 100) {
            clearInterval(interval);
            renderPresidentialRoundOne(totalGov, totalOpp, totalDialog, districtResults);
        }
    }, 120);
}

function renderPresidentialRoundOne(gov, opp, dialog, districts) {
    document.getElementById('pres-tally-gov').textContent = `Oficialismo: ${gov.toFixed(1)}%`;
    document.getElementById('pres-tally-dialog').textContent = `Dialogistas: ${dialog.toFixed(1)}%`;
    document.getElementById('pres-tally-opp').textContent = `Oposición: ${opp.toFixed(1)}%`;

    const grid = document.getElementById('pres-districts-grid');
    if (grid) {
        grid.innerHTML = '';
        districts.forEach(d => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.borderLeft = `4px solid ${d.colorGanador}`;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:0.76rem;">${d.name}</strong>
                    <span style="font-size:0.68rem; font-weight:800; color:${d.colorGanador};">${d.ganador}</span>
                </div>
                <div style="font-size:0.72rem; color:var(--text-dim); margin-top:3px; display:flex; justify-content:space-between;">
                    <span style="color:${PARTY_COLORS.government}; font-weight:700;">Of: ${d.govPct.toFixed(1)}%</span>
                    <span style="color:${PARTY_COLORS.dialog};">Dia: ${d.dialogPct.toFixed(1)}%</span>
                    <span style="color:${PARTY_COLORS.opposition}; font-weight:700;">Op: ${d.oppPct.toFixed(1)}%</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    const resCard = document.getElementById('pres-resolution-card');
    const btnAct = document.getElementById('btn-pres-action');
    if (btnAct) btnAct.style.display = 'block';

    const ganaOficialismo = gov >= 45.0 || (gov >= 40.0 && (gov - opp >= 10.0));
    const ganaOposicion = opp >= 45.0 || (opp >= 40.0 && (opp - gov >= 10.0));

    if (ganaOficialismo) {
        resCard.innerHTML = `
            <h3 style="color:var(--accent-green); margin-bottom:4px;">¡VICTORIA EN PRIMERA VUELTA!</h3>
            <p>El oficialismo obtuvo el <strong>${gov.toFixed(1)}%</strong> frente al <strong>${opp.toFixed(1)}%</strong> opositor.</p>
            <p style="color:var(--text-dim); margin-top:3px;">Has alcanzado los umbrales constitucionales para la reelección directa.</p>
        `;
        btnAct.textContent = "Ver Balance y Comenzar Segundo Mandato (Año 5-8)";
        btnAct.onclick = () => showFinalReport("Reelección Presidencial en Primera Vuelta", "Mandato renovado en las urnas por el 50%+ o diferencia legal de votos.", true);
    } else if (ganaOposicion) {
        resCard.innerHTML = `
            <h3 style="color:var(--accent-red); margin-bottom:4px;">DERROTA ELECTORAL EN PRIMERA VUELTA</h3>
            <p>La oposición reunió el <strong>${opp.toFixed(1)}%</strong> frente al <strong>${gov.toFixed(1)}%</strong> oficialista.</p>
            <p style="color:var(--text-dim); margin-top:3px;">Traspaso de mando institucional al nuevo gobierno electo.</p>
        `;
        btnAct.textContent = "Ver Balance Histórico de la Presidencia";
        btnAct.onclick = () => showFinalReport("Fin de Mandato: Derrota en Primera Vuelta", "La oposición unificada se impuso en los 12 distritos electorales.", false);
    } else {
        resCard.innerHTML = `
            <h3 style="color:var(--accent-gold); margin-bottom:4px;">¡HAY BALOTAJE PRESIDENCIAL!</h3>
            <p>Ningún frente superó los umbrales legales. Mano a mano definitivo:</p>
            <p><strong>Oficialismo (${gov.toFixed(1)}%)</strong> vs <strong>Oposición (${opp.toFixed(1)}%)</strong>.</p>
            <p style="color:var(--text-dim); margin-top:3px;">Ambos disputarán los sufragios del ${dialog.toFixed(1)}% del electorado dialogista e independiente.</p>
        `;
        btnAct.textContent = "Ingresar al Balotaje Definitivo (Segunda Vuelta)";
        btnAct.onclick = () => runPresidentialBalotaje(gov, opp, dialog);
    }
}

// 3. BALOTAJE PRESIDENCIAL
function runPresidentialBalotaje(prevGov, prevOpp, poolDialog) {
    const bar = document.getElementById('bar-pres-election');
    const grid = document.getElementById('pres-districts-grid');
    const resCard = document.getElementById('pres-resolution-card');
    const btnAct = document.getElementById('btn-pres-action');
    const subTitle = document.getElementById('pres-election-subtitle');

    if (subTitle) subTitle.textContent = "SEGUNDA VUELTA ELECTORAL (BALOTAJE PRESIDENCIAL)";
    if (bar) bar.style.width = '0%';
    if (grid) grid.innerHTML = '';
    if (resCard) resCard.innerHTML = '';
    if (btnAct) btnAct.style.display = 'none';

    const captacionOficialista = clamp((mgmt.reputation / 100) * 0.55 + (mgmt.approval / 100) * 0.45 - (mgmt.hidden.polarization * 0.002), 0.20, 0.80);
    const votosCaptadosOfi = poolDialog * captacionOficialista;
    const votosCaptadosOpp = poolDialog * (1 - captacionOficialista);

    let finalGov = prevGov + votosCaptadosOfi;
    let finalOpp = prevOpp + votosCaptadosOpp;

    const totalVotos = finalGov + finalOpp;
    finalGov = (finalGov / totalVotos) * 100;
    finalOpp = (finalOpp / totalVotos) * 100;

    let pct = 0;
    const interval = setInterval(() => {
        pct += 25;
        if (bar) bar.style.width = `${pct}%`;
        if (pct >= 100) {
            clearInterval(interval);
            renderBalotajeFinal(finalGov, finalOpp);
        }
    }, 120);
}

function renderBalotajeFinal(gov, opp) {
    document.getElementById('pres-tally-gov').textContent = `Oficialismo: ${gov.toFixed(1)}%`;
    document.getElementById('pres-tally-dialog').textContent = `Dialogistas: 0.0%`;
    document.getElementById('pres-tally-opp').textContent = `Oposición: ${opp.toFixed(1)}%`;

    const grid = document.getElementById('pres-districts-grid');
    if (grid) {
        grid.innerHTML = '';
        DISTRITOS_FEDERALES.forEach(dist => {
            const vNoise = rnd.float(-4.5, 4.5);
            const distGov = clamp(gov + vNoise, 15.0, 85.0);
            const distOpp = 100 - distGov;

            const card = document.createElement('div');
            card.className = 'card';
            card.style.borderLeft = `4px solid ${distGov >= 50 ? PARTY_COLORS.government : PARTY_COLORS.opposition}`;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:0.76rem;">${dist.name}</strong>
                    <span style="font-size:0.68rem; font-weight:800; color:${distGov >= 50 ? PARTY_COLORS.government : PARTY_COLORS.opposition};">
                        ${distGov >= 50 ? 'Oficialismo' : 'Oposición'}
                    </span>
                </div>
                <div style="font-size:0.72rem; color:var(--text-dim); margin-top:3px; display:flex; justify-content:space-between;">
                    <span style="color:${PARTY_COLORS.government}; font-weight:700;">Of: ${distGov.toFixed(1)}%</span>
                    <span style="color:${PARTY_COLORS.opposition}; font-weight:700;">Op: ${distOpp.toFixed(1)}%</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    const resCard = document.getElementById('pres-resolution-card');
    const btnAct = document.getElementById('btn-pres-action');
    if (btnAct) btnAct.style.display = 'block';

    if (gov >= 50.0) {
        resCard.innerHTML = `
            <h3 style="color:var(--accent-green); margin-bottom:4px;">¡VICTORIA EN EL BALOTAJE!</h3>
            <p>El oficialismo se impuso con el <strong>${gov.toFixed(1)}%</strong> frente al <strong>${opp.toFixed(1)}%</strong> de la oposición.</p>
            <p style="color:var(--text-dim); margin-top:2px;">Mandato renovado en las urnas por la vía democrática para 24 bimestres adicionales.</p>
        `;
        btnAct.textContent = "Ver Balance y Comenzar Segundo Mandato (Año 5-8)";
        btnAct.onclick = () => showFinalReport("Victoria Presidencial en Balotaje", `El oficialismo retuvo el poder con el ${gov.toFixed(1)}% de los votos en segunda vuelta.`, true);
    } else {
        resCard.innerHTML = `
            <h3 style="color:var(--accent-red); margin-bottom:4px;">DERROTA EN EL BALOTAJE</h3>
            <p>La oposición ganó las elecciones con el <strong>${opp.toFixed(1)}%</strong> frente al <strong>${gov.toFixed(1)}%</strong> oficialista.</p>
            <p style="color:var(--text-dim); margin-top:2px;">Concluye tu presidencia tras la entrega formal del bastón de mando.</p>
        `;
        btnAct.textContent = "Ver Balance Histórico de la Presidencia";
        btnAct.onclick = () => showFinalReport("Fin de Mandato: Derrota en Balotaje", `La oposición se impuso con el ${opp.toFixed(1)}% en segunda vuelta.`, false);
    }
}

// 4. PANTALLA DE BALANCE FINAL Y RESUMEN HISTÓRICO
function showFinalReport(titulo, descripcion, habilitarSegundoMandato = false) {
    const reportHtml = `
        <div style="display:flex; flex-direction:column; gap:6px; font-size:0.78rem;">
            <p><strong>Candidato/a:</strong> ${mgmt.candidate}</p>
            <p><strong>Aprobación Final:</strong> ${mgmt.approval.toFixed(1)}% | <strong>Reputación:</strong> ${mgmt.reputation}/100</p>
            <p><strong>PBI Final:</strong> ${money(mgmt.gdp)} | <strong>Inflación Bimestral:</strong> ${mgmt.inflation.toFixed(1)}%</p>
            <p><strong>Pobreza:</strong> ${mgmt.poverty.toFixed(1)}% | <strong>Desempleo:</strong> ${mgmt.unemployment.toFixed(1)}%</p>
            <p><strong>Fondo Nacional Restante:</strong> ${money(mgmt.funds)}</p>
            <p><strong>Deuda Soberana Acumulada:</strong> ${money(mgmt.debt)}</p>
        </div>
    `;

    window.openModal(`Balance Histórico: ${titulo}`, [
        {
            label: "Evaluación de la Gestión Presidencial",
            sub: descripcion + "<br><br>" + reportHtml,
            isTextOnly: true
        },
        habilitarSegundoMandato ? {
            label: "Comenzar Segundo Mandato Presidencial (Año 5-8)",
            tag: "Continuar",
            tagClass: "tag-safe",
            sub: "Iniciar los 24 bimestres del nuevo período de gobierno.",
            action: () => startNextMandate()
        } : {
            label: "Concluir Partida y Volver al Menú Principal",
            tag: "Finalizar",
            tagClass: "tag-cost",
            sub: "Regresar a la pantalla de inicio.",
            action: () => showScreen('home')
        }
    ], true);
}

function startNextMandate() {
    mgmt.session = 1;
    mgmt.usedSession = false;
    mgmt.approval = clamp(mgmt.approval + 4, 10, 95);
    mgmt.reputation = clamp(mgmt.reputation + 5, 10, 95);
    mgmt.lastAction = "Segundo mandato presidencial inaugurado formalmente tras victoria electoral.";
    mgmt.lastCauseText = "El electorado ratificó la conducción del Estado por 24 bimestres adicionales.";
    showScreen('management');
    renderManagement();
    renderManagementActions('gestion');
}

// 5. CONTROLADOR PRINCIPAL DE CIERRE BIMESTRAL
safeOn('btn-mgmt-next', 'click', () => {
    if (!mgmt) return;

    if (!mgmt.usedSession) {
        alert("Debes ejecutar al menos una acción política antes de concluir el bimestre.");
        return;
    }

    const btnNext = document.getElementById('btn-mgmt-next');
    if (btnNext) btnNext.classList.remove('pulse-ready');

    // 1. Amenazas existenciales terminales
    if (typeof checkExistentialThreats === 'function') {
        const finPartida = checkExistentialThreats();
        if (finPartida) return;
    }

    // 2. Macroeconomía bimestral
    applyEconomyTick();
    recordHistory();

    // 3. Elecciones intermedias en el Bimestre 12
    if (mgmt.session === 12) {
        runMidtermElection();
        return;
    }

    // 4. Elecciones presidenciales en el Bimestre 24
    if (mgmt.session >= mgmt.maxSessions) {
        runPresidentialElection();
        return;
    }

    // 5. Avance de turno
    mgmt.session++;
    mgmt.usedSession = false;

    // 6. Periódico bimestral y luego eventos / iniciativas del Congreso
    showBimonthlyNewspaper(() => {
        // Evaluación de crisis institucional
        if (typeof resolveInstitutionalCrisis === 'function') {
            const golpe = resolveInstitutionalCrisis();
            if (golpe) return;
        }

        // Iniciativas legislativas del Congreso o dilemas contextuales
        if ((mgmt.session === 6 || mgmt.session === 18) && typeof triggerLegislativeInitiative === 'function') {
            triggerLegislativeInitiative();
        } else if (typeof triggerContextualDecisionEvent === 'function') {
            triggerContextualDecisionEvent();
        }

        renderManagement();
        renderManagementActions(document.querySelector('.mgmt-tab-btn.active')?.dataset.mgmtTab || 'gestion');
    });
});
