// GESTIÓN: MOTOR DE CRISIS EXISTENCIALES, EVENTOS ROTATIVOS Y DIARIO DE NOTICIAS

let pendingModalCallback = null;
let currentModalIsMandatory = false;

// Sobrescribimos y blindamos openModal en el ámbito global para evitar salteos
window.openModal = function(title, buttonsConfig, isMandatory = false, onClose = null) {
    pendingModalCallback = onClose;
    currentModalIsMandatory = isMandatory;

    const modal = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const cancelBtn = document.getElementById('btn-modal-cancel');

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = '';

    buttonsConfig.forEach(cfg => {
        const btn = document.createElement('button');
        btn.className = 'btn-sub';
        
        if (cfg.isTextOnly) {
            btn.style.cursor = 'default';
            btn.style.background = 'transparent';
            btn.style.borderColor = 'transparent';
            btn.style.borderBottom = '1px solid var(--card-border)';
            btn.style.padding = '4px 8px 12px 8px';
            btn.style.marginBottom = '8px';
        }
        
        btn.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <strong>${cfg.label}</strong>
                ${cfg.tag ? `<span class="${cfg.tagClass}">${cfg.tag}</span>` : ''}
            </div>
            <span style="font-size:0.75rem; color:var(--text-dim); line-height:1.35;">${cfg.sub || ''}</span>
        `;
        
        btn.onclick = () => {
            if (cfg.isTextOnly) return; 
            modal.classList.remove('active');
            pendingModalCallback = null; 
            if (typeof cfg.action === 'function') cfg.action();
        };
        modalBody.appendChild(btn);
    });

    if (cancelBtn) {
        cancelBtn.style.display = isMandatory ? 'none' : 'block';
        cancelBtn.onclick = () => {
            if (currentModalIsMandatory) return;
            modal.classList.remove('active');
            if (typeof pendingModalCallback === 'function') {
                const cb = pendingModalCallback;
                pendingModalCallback = null;
                setTimeout(cb, 100);
            }
        };
    }

    modal.onclick = (e) => {
        if (e.target === modal && !currentModalIsMandatory) {
            modal.classList.remove('active');
            if (typeof pendingModalCallback === 'function') {
                const cb = pendingModalCallback;
                pendingModalCallback = null;
                setTimeout(cb, 100);
            }
        }
    };

    modal.classList.add('active');
};

// 1. VERIFICACIÓN DE CRISIS EXISTENCIALES TERMINALES
function checkExistentialThreats() {
    const h = mgmt.hidden;
    const f = mgmt.flags;

    // Asalto popular a la Casa Presidencial
    if ((h.mobPressure >= 85 || (mgmt.poverty > 55 && h.criticalApprovalTurns >= 2)) && mgmt.approval < 16) {
        const fuerzasLeales = mgmt.alloc.defense >= 15 && h.militaryLoyalty >= 50;

        window.openModal("🚨 ESTALLIDO SOCIAL: Asalto a la Casa Presidencial", [
            {
                label: "Situación Crítica: La multitud derribó los portones exteriores",
                sub: fuerzasLeales 
                    ? "La guardia oficial resiste en los accesos pero solicita directivas inmediatas."
                    : "Las fuerzas de seguridad abandonaron los cordones. La masa toma posesión de los pasillos.",
                isTextOnly: true
            },
            {
                label: "Evacuar de Emergencia en Helicóptero",
                tag: "Huida",
                tagClass: "tag-risk",
                sub: "Abandonas la conducción nacional en medio de saqueos generalizados.",
                action: () => triggerTerminalGameOver("Renuncia forzada y huida aérea tras el asalto y toma física de la sede de gobierno.")
            },
            {
                label: "Resistir en el Despacho Oficial",
                tag: "Linchamiento",
                tagClass: "tag-risk",
                sub: "Las puertas son derribadas. Enfrentas a la multitud sin garantías institucionales.",
                action: () => triggerTerminalGameOver("Destitución forzada y linchamiento institucional transmitido en cadena nacional.")
            }
        ], true);
        return true;
    }

    // Intervención armada internacional
    if (h.foreignHostility >= 90) {
        window.openModal("💥 INTERVENCIÓN MILITAR EXTRANJERA: Operación Relámpago", [
            {
                label: "Bloqueo Naval y Despliegue de Comandos Especiales",
                sub: "Potencias extranjeras destruyeron bases aéreas y comandos especiales rodean la capital.",
                isTextOnly: true
            },
            {
                label: "Rendición Incondicional ante Fuerzas Especiales",
                tag: "Extradición",
                tagClass: "tag-risk",
                sub: "Tropas extranjeras irrumpen en el búnker. Eres trasladado a un tribunal militar foráneo.",
                action: () => triggerTerminalGameOver("Secuestro militar y extradición forzada tras conflicto bélico internacional.")
            }
        ], true);
        return true;
    }

    // Ataque misilístico previo
    if (h.foreignHostility >= 70 && !f.internationalEmbargo) {
        f.internationalEmbargo = true;
        mgmt.gdp *= 0.92;
        mgmt.energy = Math.max(10, mgmt.energy - 35);
        window.openModal("⚠️ ATAQUE MISILÍSTICO A INFRAESTRUCTURA", [
            {
                label: "Bombardeos sobre refinerías y nodos troncales",
                sub: "Sanción punitiva foránea por desafío geopolítico. La matriz energética entra en colapso.",
                tag: "Ataque",
                tagClass: "tag-risk",
                action: () => {
                    mgmt.lastAction = "Bombardeo internacional sobre plantas eléctricas y puertos.";
                    mgmt.lastCauseText = "Desafiaste frontalmente a potencias mundiales.";
                    renderManagement();
                }
            }
        ], true);
        return true;
    }

    return false;
}

function resolveInstitutionalCrisis() {
    const h = mgmt.hidden;
    if (h.coupRisk < 72 || h.militaryLoyalty > 55) return false;
    const chance = clamp(0.08 + (h.coupRisk - 72) * 0.018 + (55 - h.militaryLoyalty) * 0.012, 0.08, 0.65);
    if (Math.random() >= chance) {
        h.militaryLoyalty = clamp(h.militaryLoyalty - 1.5, 0, 100);
        mgmt.lastAction = '[CRISIS INSTITUCIONAL] Altos mandos presionan públicamente al gobierno, pero la cadena de mando se mantiene.';
        h.institutionalTrust -= 3;
        return false;
    }
    h.stability -= 15;
    h.institutionalTrust -= 10;
    mgmt.approval -= 8;
    if (h.militaryLoyalty < 35 && h.coupRisk > 85) {
        mgmt.lastAction = '[GOLPE DE ESTADO] La crisis institucional rompe la continuidad constitucional.';
        triggerTerminalGameOver("Golpe de Estado militar ante el colapso de la lealtad y el orden constitucional.");
        return true;
    }
    mgmt.lastAction = '[CRISIS INSTITUCIONAL] Se intenta forzar una salida política y la continuidad queda en riesgo.';
    return false;
}

function triggerTerminalGameOver(causaTexto) {
    if (typeof showFinalReport === 'function') {
        showFinalReport("Mandato Interrumpido: Ruptura Institucional", causaTexto, false);
    } else {
        window.openModal("FIN DE PARTIDA", [{ label: "Volver al Menú", action: () => showScreen('home') }], true);
    }
}

// 2. PERIÓDICO NACIONAL BIMESTRAL (ESTILO NATIONSTATES)
function showBimonthlyNewspaper(onContinue) {
    const session = mgmt.session;
    const anio = Math.ceil(session / 6);
    const bim = ((session - 1) % 6) + 1;

    let headlines = [];

    if (mgmt.lastAction && mgmt.lastAction !== 'Asunción formal del Poder Ejecutivo.') {
        headlines.push(`🗞️ <strong>MEDIDA OFICIAL:</strong> ${mgmt.lastAction} — ${mgmt.lastCauseText}`);
    } else {
        headlines.push(`🗞️ <strong>POLÍTICA:</strong> El Ejecutivo inicia un nuevo período bajo estricta observación ciudadana.`);
    }

    if (mgmt.inflation > 15) {
        headlines.push(`📈 <strong>INFLACIÓN AL ROJO VIVO:</strong> La suba de precios acumulada del ${mgmt.inflation.toFixed(1)}% desata remarcaciones en góndolas y alarma bancaria.`);
    } else if (mgmt.deficit > 4) {
        headlines.push(`🏛️ <strong>ALERTA FISCAL:</strong> El déficit en ${mgmt.deficit.toFixed(1)}% tensiona las cuentas y el mercado exige frenar el gasto público.`);
    } else if (mgmt.funds <= 0) {
        headlines.push(`💵 <strong>TESORO EN CAJA CERO:</strong> El Banco Central asiste con emisión y deuda de emergencia ante la falta de liquidez fiscal.`);
    } else {
        headlines.push(`📊 <strong>MERCADOS ESTABLES:</strong> Indicadores macroeconómicos muestran previsibilidad temporal.`);
    }

    if (session === 11) {
        headlines.push(`🗳️ <strong>CLIMA ELECTORAL:</strong> Se intensifica la campaña para las Elecciones Legislativas de Medio Término.`);
    } else if (session === 23) {
        headlines.push(`🗳️ <strong>RECTA FINAL PRESIDENCIAL:</strong> Los 12 distritos federales definirán el próximo rumbo del país.`);
    } else if (mgmt.approval > 60) {
        headlines.push(`👑 <strong>POPULARIDAD EN ALZA:</strong> Las encuestas otorgan un holgado ${mgmt.approval.toFixed(1)}% de imagen positiva.`);
    } else if (mgmt.approval < 25) {
        headlines.push(`⚠️️ <strong>DESCONTENTO GENERAL:</strong> La aprobación se hunde al ${mgmt.approval.toFixed(1)}% en medio de críticas de la oposición.`);
    } else {
        headlines.push(`🤝 <strong>PANORAMA SOCIAL:</strong> Tensión moderada en sindicatos y gobernaciones a la espera de nuevas medidas.`);
    }

    window.openModal(`Gaceta Federal • Año ${anio}, Bimestre ${bim}`, [
        {
            label: "Titulares Nacionales del Bimestre",
            sub: headlines.join("<br><br>"),
            isTextOnly: true
        },
        {
            label: "Continuar al Despacho Presidencial",
            tag: "Avanzar",
            tagClass: "tag-safe",
            sub: "Analizar el estado de la República y atender las novedades del bimestre.",
            action: () => {
                if (typeof onContinue === 'function') onContinue();
            }
        }
    ], false, onContinue);
}

// 3. CATÁLOGO ROTATIVO DE EVENTOS CONTEXTUALES E INICIATIVAS
function triggerContextualDecisionEvent() {
    const h = mgmt.hidden;
    const pool = [];

    // Crisis Financiera / Cambiaria
    if (mgmt.deficit > 2.5 || (mgmt.inflation > 6 && rnd.float(0, 10) > 3)) {
        pool.push({
            title: "Tensión Cambiaria y Presión sobre Tasas",
            desc: "Bancos reportan demanda creciente de divisas. El Banco Central pide directivas sobre tasas de interés.",
            options: [
                {
                    label: "Subir la tasa de interés al " + (mgmt.interestRate + 12).toFixed(0) + "%",
                    sub: "Atrae depósitos y frena el dólar, pero enfría el crédito y desacelera la actividad.",
                    action: () => {
                        mgmt.interestRate += 12;
                        mgmt.unemployment += 0.5;
                        mgmt.lastAction = "Suba de tasa de política monetaria.";
                        mgmt.lastCauseText = "Contención cambiaria a costa de encarecer el financiamiento pyme.";
                        renderManagement();
                    }
                },
                {
                    label: "Dejar flotar el tipo de cambio y preservar reservas",
                    sub: "No interviene en el mercado; devaluación moderada trasladada a precios.",
                    action: () => {
                        // Corrección: incrementa el valor de la divisa proporcionalmente sin clamp a 3
                        mgmt.currency = Math.max(1, mgmt.currency * 1.08);
                        if (mgmt.parallelCurrency) mgmt.parallelCurrency = Math.max(1, mgmt.parallelCurrency * 1.06);
                        mgmt.inflation += 2.2;
                        mgmt.approval -= 1.5;
                        mgmt.lastAction = "Flotación cambiaria sin intervención.";
                        mgmt.lastCauseText = "El mercado corrigió el tipo de cambio con leve impacto en góndolas.";
                        renderManagement();
                    }
                }
            ]
        });
    }

    // Paritarias y Tensión Sindical
    if (mgmt.inflation > 8.0 && !mgmt.wageIndexation) {
        pool.push({
            title: "Exigencia de Paritarias Indexadas Mensuales",
            desc: "Las centrales obreras exigen cláusula gatillo mensual por inflación o decretarán un paro logístico de 48 horas.",
            options: [
                {
                    label: "Conceder indexación salarial por decreto",
                    sub: "Calma a los gremios pero acelera el gasto público en los siguientes bimestres.",
                    action: () => {
                        mgmt.wageIndexation = true;
                        mgmt.approval += 3;
                        h.laborTension = Math.max(0, h.laborTension - 8);
                        mgmt.lastAction = "Indexación salarial obligatoria concedida.";
                        mgmt.lastCauseText = "El Estado cubrió los desfasajes aumentando el gasto corriente futuro.";
                        renderManagement();
                    }
                },
                {
                    label: "Rechazar de plano y absorber el costo del paro",
                    sub: "Paraliza trenes, puertos y camiones; merma en recaudación y actividad fabril.",
                    action: () => {
                        mgmt.gdp *= 0.988;
                        mgmt.funds = Math.max(0, mgmt.funds - 40000);
                        h.laborTension += 10;
                        mgmt.lastAction = "Huelga general por rechazo a indexación.";
                        mgmt.lastCauseText = "Parálisis logística con daño directo en la recaudación fiscal.";
                        renderManagement();
                    }
                }
            ]
        });
    }

    // Conflicto Federal con Gobernadores
    if (mgmt.deficit > 2.0 && rnd.float(0, 10) > 4) {
        pool.push({
            title: "Rebelión de Provincias: Reclamo de Fondos de Coparticipación",
            desc: "Los distritos del interior advierten que no podrán liquidar sueldos públicos sin transferencias extraordinarias.",
            options: [
                {
                    label: "Girar salvataje federal de $75.000",
                    sub: "Evita conflictos provinciales pero agranda el déficit del Tesoro.",
                    action: () => {
                        mgmt.funds = Math.max(0, mgmt.funds - 75000);
                        mgmt.governorsLoyalty = Math.min(100, (mgmt.governorsLoyalty || 50) + 18);
                        mgmt.lastAction = "Giro de auxilio financiero a gobernaciones.";
                        mgmt.lastCauseText = "Se alinearon gobernadores a costa de liquidez central.";
                        renderManagement();
                    }
                },
                {
                    label: "Negar giros y exigir ajuste fiscal en las provincias",
                    sub: "Los gobernadores amenazan con trabar leyes en el Senado.",
                    action: () => {
                        mgmt.governorsLoyalty = Math.max(0, (mgmt.governorsLoyalty || 50) - 20);
                        mgmt.congress.senate.government = Math.max(8, mgmt.congress.senate.government - 2);
                        mgmt.lastAction = "Negativa a auxilio fiscal provincial.";
                        mgmt.lastCauseText = "Gobernadores ordenaron endurecer el bloqueo en el Senado.";
                        renderManagement();
                    }
                }
            ]
        });
    }

    // Leyes propuestas e iniciativas del Congreso
    pool.push({
        title: "Sanción Parlamentaria: Ley de Emergencia Pyme",
        desc: "El Congreso aprobó alivio impositivo para comercios con financiamiento no previsto en el presupuesto.",
        options: [
            {
                label: "Promulgar la norma (Costo fiscal: $60.000)",
                sub: "Mejora la aprobación pyme pero resta margen de tesorería.",
                action: () => {
                    mgmt.funds = Math.max(0, mgmt.funds - 60000);
                    mgmt.industry += 3;
                    mgmt.approval += 2;
                    mgmt.lastAction = "Ley de Emergencia Pyme promulgada.";
                    mgmt.lastCauseText = "Alivio comercial con costo a cuentas de tesorería.";
                    renderManagement();
                }
            },
            {
                label: "Vetar la ley por inconsistencia presupuestaria",
                sub: "Preserva los fondos pero genera acusaciones de insensibilidad económica.",
                action: () => {
                    mgmt.approval -= 2;
                    h.polarization = (h.polarization || 0) + 3;
                    mgmt.lastAction = "Veto presidencial a la Ley Pyme.";
                    mgmt.lastCauseText = "Se preservó el equilibrio fiscal frente a la oposición.";
                    renderManagement();
                }
            }
        ]
    });

    pool.push({
        title: "Dilema Energético: Cuadro Tarifario ante el Pico de Demanda",
        desc: "Las distribuidoras eléctricas demandan recomponer tarifas para evitar apagones masivos en verano.",
        options: [
            {
                label: "Autorizar aumento de tarifas a usuarios residenciales",
                sub: "Garantiza suministro y mantenimiento eléctrico pero impacta en el costo de vida familiar.",
                action: () => {
                    mgmt.poverty += 0.8;
                    mgmt.energy = Math.min(100, mgmt.energy + 5);
                    mgmt.approval -= 1.5;
                    mgmt.lastAction = "Actualización tarifaria eléctrica autorizada.";
                    mgmt.lastCauseText = "Inversión en redes con impacto en facturas domiciliarias.";
                    renderManagement();
                }
            },
            {
                label: "Cubrir el costo con subsidios directos del Tesoro ($45.000)",
                sub: "Evita el golpe al bolsillo ciudadano pero presiona el gasto público.",
                action: () => {
                    mgmt.funds = Math.max(0, mgmt.funds - 45000);
                    mgmt.energy = Math.min(100, mgmt.energy + 2);
                    mgmt.lastAction = "Subsidio de emergencia a plantas generadoras.";
                    mgmt.lastCauseText = "El Tesoro absorbió la brecha para congelar boletas.";
                    renderManagement();
                }
            }
        ]
    });

    const ev = pool[rnd.next(0, pool.length)];
    window.openModal(`Decisión Presidencial: ${ev.title}`, [
        {
            label: `Situación: ${ev.desc}`,
            sub: "Elige la resolución del Poder Ejecutivo para este bimestre.",
            isTextOnly: true
        },
        ...ev.options.map(opt => ({
            label: opt.label,
            sub: opt.sub,
            tag: "Resolver",
            tagClass: "tag-safe",
            action: opt.action
        }))
    ], true);
}
