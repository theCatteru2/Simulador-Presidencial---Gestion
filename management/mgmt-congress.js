function generateHemicycleSVG(svgId, totalSeats, ruling, dialog, opposition) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    svg.innerHTML = '';

    const rows = svgId.includes('deputies') ? 5 : 3;
    const cx = 150;
    const cy = 145;
    const baseRadius = 45;
    const rowSpacing = svgId.includes('deputies') ? 20 : 25;

    let seatsPerRow = [];
    let remaining = totalSeats;
    for (let r = 0; r < rows; r++) {
        let rowSeats = Math.round(totalSeats * ((baseRadius + r * rowSpacing) / ((baseRadius * rows) + (rowSpacing * rows * (rows - 1) / 2))));
        seatsPerRow.push(rowSeats);
        remaining -= rowSeats;
    }
    seatsPerRow[rows - 1] += remaining;

    let seatTypes = [];
    for (let i = 0; i < opposition; i++) seatTypes.push(PARTY_COLORS.opposition);
    for (let i = 0; i < dialog; i++) seatTypes.push(PARTY_COLORS.dialog);
    for (let i = 0; i < ruling; i++) seatTypes.push(PARTY_COLORS.government);

    let seatIdx = 0;
    for (let r = 0; r < rows; r++) {
        const count = seatsPerRow[r];
        const radius = baseRadius + r * rowSpacing;
        for (let s = 0; s < count; s++) {
            if (seatIdx >= totalSeats) break;
            const angle = Math.PI - (s / (count - 1 || 1)) * Math.PI;
            const x = cx + radius * Math.cos(angle);
            const y = cy - radius * Math.sin(angle);

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", x.toFixed(1));
            circle.setAttribute("cy", y.toFixed(1));
            circle.setAttribute("r", svgId.includes('deputies') ? "4" : "6");
            circle.setAttribute("fill", seatTypes[seatIdx] || "#475569");
            circle.setAttribute("class", "seat-dot");
            svg.appendChild(circle);
            seatIdx++;
        }
    }
}

function renderCongress() {
    if (!mgmt) return;
    const dep = mgmt.congress.deputies;
    const sen = mgmt.congress.senate;

    generateHemicycleSVG('svg-deputies', 120, dep.government, dep.dialog, dep.opposition);
    generateHemicycleSVG('svg-senate', 36, sen.government, sen.dialog, sen.opposition);

    const depLeg = document.getElementById('deputies-legend');
    if (depLeg) {
        depLeg.innerHTML = `
            <span><span class="party-dot" style="background:${PARTY_COLORS.government};"></span>Oficialismo: <strong>${dep.government}</strong></span>
            <span><span class="party-dot" style="background:${PARTY_COLORS.dialog};"></span>Dialogistas: <strong>${dep.dialog}</strong></span>
            <span><span class="party-dot" style="background:${PARTY_COLORS.opposition};"></span>Oposición: <strong>${dep.opposition}</strong></span>
        `;
    }

    const senLeg = document.getElementById('senate-legend');
    if (senLeg) {
        senLeg.innerHTML = `
            <span><span class="party-dot" style="background:${PARTY_COLORS.government};"></span>Oficialismo: <strong>${sen.government}</strong></span>
            <span><span class="party-dot" style="background:${PARTY_COLORS.dialog};"></span>Dialogistas: <strong>${sen.dialog}</strong></span>
            <span><span class="party-dot" style="background:${PARTY_COLORS.opposition};"></span>Oposición: <strong>${sen.opposition}</strong></span>
        `;
    }
}

function showInitialCongress() {
    const preview = { deputies: { government: 40, opposition: 52, dialog: 28 }, senate: { government: 18, opposition: 10, dialog: 8 } };
    const old = mgmt;
    mgmt = { congress: preview };
    renderCongress();
    mgmt = old;
    const bTitle = document.getElementById('bill-title');
    const bRes = document.getElementById('bill-result');
    if (bTitle) bTitle.textContent = 'Composición Constitucional Inicial';
    if (bRes) bRes.textContent = 'El oficialismo inicia con 40 diputados y 18 senadores.';
    showScreen('congress');
}

function calculateCongressSupportDetailed(title = '') {
    const align = clamp((mgmt.approval - 40) / 30, -1, 1);
    const controversy = /laboral|privat|electoral|censura/i.test(title) ? 6 : 0;
    const dialogShare = 0.45 + align * 0.25 - controversy * 0.03;

    const govDep = mgmt.congress.deputies.government;
    const dialogDepYes = Math.round(mgmt.congress.deputies.dialog * dialogShare);
    const dialogDepAbs = Math.round(mgmt.congress.deputies.dialog * 0.15);
    const depAfirmative = clamp(govDep + dialogDepYes + rnd.next(-2, 3), 0, 120);
    const depAbstention = clamp(dialogDepAbs, 0, 120);
    const depNegative = clamp(120 - depAfirmative - depAbstention, 0, 120);

    const govSen = mgmt.congress.senate.government;
    const dialogSenYes = Math.round(mgmt.congress.senate.dialog * (dialogShare - 0.04));
    const dialogSenAbs = Math.round(mgmt.congress.senate.dialog * 0.12);
    const senAfirmative = clamp(govSen + dialogSenYes + rnd.next(-1, 2), 0, 36);
    const senAbstention = clamp(dialogSenAbs, 0, 36);
    const senNegative = clamp(36 - senAfirmative - senAbstention, 0, 36);

    return {
        deputies: { afirmative: depAfirmative, negative: depNegative, abstention: depAbstention },
        senate: { afirmative: senAfirmative, negative: senNegative, abstention: senAbstention }
    };
}

function submitBill(title, effect) {
    if (!mgmt) return;
    mgmt.usedSession = true;
    const support = calculateCongressSupportDetailed(title);

    const passedDeputies = support.deputies.afirmative >= 61;
    const passedSenate = support.senate.afirmative >= 19;

    const bTitle = document.getElementById('bill-title');
    const bRes = document.getElementById('bill-result');
    if (bTitle) bTitle.textContent = 'Votación Nominal: ' + title;

    const depStr = `Diputados (120): ${support.deputies.afirmative} Aprobado, ${support.deputies.negative} Desaprobado, ${support.deputies.abstention} Abstención.`;
    const senStr = `Senado (36): ${support.senate.afirmative} Aprobado, ${support.senate.negative} Desaprobado, ${support.senate.abstention} Abstención.`;

    if (passedDeputies && passedSenate) {
        effect();
        mgmt.lastAction = `La ley «${title}» fue SANCIONADA en ambas cámaras.`;
        mgmt.lastCauseText = `Mayoría construida con aliados. ${depStr}`;
        if (bRes) bRes.innerHTML = `<strong class="good-text">SANCIONADA</strong><br>${depStr}<br>${senStr}`;
        mgmt.hidden.institutionalTrust += 2;
    } else {
        mgmt.lastAction = `La ley «${title}» fue RECHAZADA en el Congreso.`;
        mgmt.lastCauseText = `Bloqueo parlamentario. ${depStr}`;
        if (bRes) bRes.innerHTML = `<strong class="danger-text">RECHAZADA</strong><br>${depStr}<br>${senStr}`;
        mgmt.hidden.polarization += 3;
    }
    renderManagement();
    renderManagementActions(document.querySelector('.mgmt-tab-btn.active')?.dataset.mgmtTab || 'gobierno');

    window.openModal("Cómputo Nominal en el Congreso", [
        {
            label: passedDeputies && passedSenate ? "¡Proyecto de Ley Sancionado!" : "Proyecto de Ley Rechazado",
            sub: `${depStr}<br>${senStr}`,
            tag: passedDeputies && passedSenate ? "Sancionada" : "Rechazada",
            tagClass: passedDeputies && passedSenate ? "tag-safe" : "tag-risk",
            action: () => {}
        }
    ]);
}

function checkSupremeCourtJudicialReview(normaTitle) {
    setTimeout(() => {
        const tirada = rnd.float(0, 100);
        const inconstitucional = tirada < (55 + (mgmt.hidden.polarization * 0.3));
        if (inconstitucional) {
            window.openModal(`Fallo Judicial: Inconstitucionalidad de ${normaTitle}`, [
                {
                    label: "Acatar la Sentencia y Derogar el Decreto",
                    sub: "Preserva la seguridad jurídica pero anula los fondos y concesiones obtenidas.",
                    tag: "Institucional",
                    tagClass: "tag-safe",
                    action: () => {
                        mgmt.funds = Math.max(0, mgmt.funds - 100000);
                        mgmt.autonomy += 6;
                        mgmt.reputation += 4;
                        mgmt.lastAction = `Fallo judicial acatado sobre ${normaTitle}.`;
                        mgmt.lastCauseText = "El Ejecutivo respetó la división de poderes.";
                        renderManagement();
                    }
                },
                {
                    label: "Desobedecer el Fallo y Ratificar el Decreto",
                    sub: "Desata un conflicto de poderes. Severo riesgo de juicio político o quiebre institucional.",
                    tag: "Conflicto",
                    tagClass: "tag-risk",
                    action: () => {
                        mgmt.approval -= 7;
                        mgmt.hidden.institutionalTrust -= 18;
                        mgmt.hidden.stability -= 14;
                        mgmt.lastAction = `Conflicto de poderes desatado por desobedecer a la Corte.`;
                        mgmt.lastCauseText = "El gobierno desconoció la autoridad del Poder Judicial.";
                        renderManagement();
                    }
                }
            ], true);
        }
    }, 600);
}

function triggerLegislativeInitiative() {
    const iniciativas = [
        {
            title: "Ley de Aumento Previsional de Emergencia",
            desc: "Los legisladores sancionaron una suba obligatoria de haberes jubilatorios sin financiamiento asignado.",
            cost: 110000,
            impactPromulgar: () => {
                if (typeof spendCost === 'function') spendCost(110000);
                else mgmt.funds = Math.max(0, mgmt.funds - 110000);
                mgmt.poverty -= 1.8;
                mgmt.approval += 3;
                mgmt.lastAction = "Ley de aumento previsional promulgada.";
                mgmt.lastCauseText = "El Estado asumió el costo para proteger ingresos.";
            }
        },
        {
            title: "Ley de Blindaje Presupuestario Universitario",
            desc: "Bancadas aliadas y opositoras acordaron actualizar partidas para universidades nacionales.",
            cost: 90000,
            impactPromulgar: () => {
                if (typeof spendCost === 'function') spendCost(90000);
                else mgmt.funds = Math.max(0, mgmt.funds - 90000);
                mgmt.approval += 2.5;
                mgmt.alloc.education = Math.min(40, mgmt.alloc.education + 2);
                mgmt.lastAction = "Ley universitaria promulgada.";
                mgmt.lastCauseText = "Se actualizaron partidas educativas obligatorias.";
            }
        }
    ];

    const ley = iniciativas[rnd.next(0, iniciativas.length)];

    window.openModal(`Sanción Parlamentaria: ${ley.title}`, [
        {
            label: `Promulgar la Ley (Costo fiscal: ${money(ley.cost)})`,
            sub: "Respeta la voluntad del Congreso pero compromete las cuentas públicas.",
            tag: "Promulgar",
            tagClass: "tag-safe",
            action: () => {
                ley.impactPromulgar();
                renderManagement();
            }
        },
        {
            label: "Vetar Totalmente la Ley por Inviabilidad Fiscal",
            sub: "El Congreso convocará a sesión especial para intentar quebrar tu veto con dos tercios de los votos.",
            tag: "Veto",
            tagClass: "tag-risk",
            action: () => {
                executeVetoChallenge(ley);
            }
        }
    ], true);
}

function executeVetoChallenge(ley) {
    showScreen('congress');
    const bTitle = document.getElementById('bill-title');
    const bRes = document.getElementById('bill-result');
    if (bTitle) bTitle.textContent = `Sesión Especial: Insistencia de Veto a ${ley.title}`;

    const dep = mgmt.congress.deputies;
    const sen = mgmt.congress.senate;

    const vDep = dep.opposition + Math.round(dep.dialog * 0.65) + rnd.next(-4, 5);
    const vSen = sen.opposition + Math.round(sen.dialog * 0.60) + rnd.next(-2, 3);

    const vetoQuebrado = vDep >= 80 && vSen >= 24;

    if (vetoQuebrado) {
        ley.impactPromulgar();
        mgmt.approval -= 2.5;
        mgmt.lastAction = `Veto quebrado en el Congreso sobre ${ley.title}.`;
        mgmt.lastCauseText = "El Parlamento reunió los dos tercios e impuso la norma.";
        if (bRes) bRes.innerHTML = `<strong class="danger-text">VETO QUEBRADO POR DOS TERCIOS</strong><br>Diputados: ${vDep}/120 (Mínimo: 80) | Senado: ${vSen}/36 (Mínimo: 24). La ley entra en vigor obligatoria.`;
    } else {
        mgmt.approval += 1.5;
        mgmt.lastAction = `Veto presidencial sostenido en ${ley.title}.`;
        mgmt.lastCauseText = "El oficialismo retuvo el tercio de bloqueo y blindó las cuentas.";
        if (bRes) bRes.innerHTML = `<strong class="good-text">VETO PRESIDENCIAL BLINDADO</strong><br>Diputados: ${vDep}/120 | Senado: ${vSen}/36. El Parlamento no alcanzó los dos tercios y el proyecto queda archivado.`;
    }
    renderManagement();
}

safeOn('btn-mgmt-congress', 'click', () => { renderCongress(); showScreen('congress'); });
safeOn('btn-congress-back', 'click', () => showScreen('management'));