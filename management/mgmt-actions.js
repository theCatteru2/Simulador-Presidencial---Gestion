// GESTIÓN: MOTOR EXPANDIDO DE ACCIONES POLÍTICAS, LEYES, DECRETOS Y GOBERNABILIDAD

function requestActionConfirmation(actionDef) {
    if (!mgmt) return;

    if (mgmt.usedSession) {
        alert("Ya ejecutaste la acción política de este bimestre. Puedes avanzar con 'Cerrar Bimestre' o ajustar los deslizadores fiscales.");
        return;
    }

    window.openModal(`Despacho Presidencial: ${actionDef.title}`, [
        {
            label: `Informe de Situación: ${actionDef.desc}`,
            sub: "Las consecuencias económicas, institucionales y sectoriales se aplicarán de inmediato.",
            isTextOnly: true
        },
        {
            label: "Promulgar Resolución Oficial",
            tag: "Promulgar",
            tagClass: "tag-safe",
            sub: "Ejecuta los efectos y consume el turno de acción de este bimestre.",
            action: () => actionDef.execute()
        }
    ]);
}

function spendCost(amount) {
    if (mgmt.funds >= amount) {
        mgmt.funds -= amount;
    } else {
        const diff = amount - mgmt.funds;
        mgmt.funds = 0;
        mgmt.debt += diff;
        if (mgmt.monetaryBase) mgmt.monetaryBase += diff * 0.85;
        mgmt.hidden.financialPressure += 2.5;
    }
}

function spendSession(label, causeExplanation, fn) {
    if (!mgmt) return;
    mgmt.usedSession = true;
    fn();
    mgmt.lastAction = label;
    mgmt.lastCauseText = causeExplanation;

    const h = mgmt.hidden;
    if (mgmt.funds <= 0) h.financialPressure += 8;
    if (mgmt.approval < 35) h.socialTension += 3;
    if (mgmt.inflation > 12) h.investment -= 3;
    if (mgmt.autonomy < 40) h.externalPressure += 4;
    if (mgmt.reputation < 35) h.institutionalTrust -= 3;

    renderManagement();
    renderManagementActions(document.querySelector('.mgmt-tab-btn.active')?.dataset.mgmtTab || 'gestion');

    // Retroalimentación visual: animación de pulso y auto-scroll
    const btnNext = document.getElementById('btn-mgmt-next');
    if (btnNext) btnNext.classList.add('pulse-ready');

    const screenMgmt = document.getElementById('screen-management');
    const appFrame = document.getElementById('app-frame');
    if (screenMgmt) screenMgmt.scrollTo({ top: 0, behavior: 'smooth' });
    if (appFrame) appFrame.scrollTo({ top: 0, behavior: 'smooth' });

    window.openModal("Resolución Oficial Promulgada", [
        {
            label: label,
            sub: causeExplanation + "<br><br><span style='color:var(--accent-gold); font-weight:700;'>👉 Acción consumida: Haz clic arriba en 'Cerrar Bimestre' para avanzar.</span>",
            tag: "En Vigor",
            tagClass: "tag-safe",
            action: () => {}
        }
    ]);
}

function openManualDevaluationModal() {
    window.openModal("Fijación / Devaluación de la Moneda", [
        {
            label: `Cotización Oficial: 1 USD = $${Math.round(mgmt.currency).toLocaleString('es-AR')}`,
            sub: "Subir el valor del dólar estimula exportaciones pero traslada precios a góndolas de inmediato.",
            isTextOnly: true
        },
        {
            label: "Microdevaluación Táctica del 8%",
            sub: `Ajuste suave. El dólar pasa a $${Math.round(mgmt.currency * 1.08).toLocaleString('es-AR')} (+1.2% inflación).`,
            tag: "Gradual",
            tagClass: "tag-safe",
            action: () => spendSession("Microdevaluación táctica", "Se corrigió el tipo de cambio oficial un 8% para sostener exportaciones.", () => {
                mgmt.currency *= 1.08;
                if (mgmt.parallelCurrency) mgmt.parallelCurrency *= 1.06;
                mgmt.inflation += 1.2;
            })
        },
        {
            label: `Devaluación del 20% (Dólar a $${Math.round(mgmt.currency * 1.25).toLocaleString('es-AR')})`,
            sub: "Aumenta la paridad oficial un 25%. Salto inflacionario moderado (+3.5%).",
            tag: "Moderada",
            tagClass: "tag-cost",
            action: () => spendSession("Devaluación cambiaria del 20%", "Se ajustó el tipo de cambio oficial.", () => {
                mgmt.currency *= 1.25;
                if (mgmt.parallelCurrency) mgmt.parallelCurrency *= 1.20;
                mgmt.inflation += 3.5;
                mgmt.approval -= 2;
            })
        },
        {
            label: `Megadevaluación del 50% (Dólar a $${Math.round(mgmt.currency * 2.0).toLocaleString('es-AR')})`,
            sub: "Duplica el valor del dólar. Salto inflacionario de shock (+12%) y caída del poder adquisitivo.",
            tag: "Shock",
            tagClass: "tag-risk",
            action: () => spendSession("Megadevaluación de shock", "Se duplicó la cotización oficial de la divisa extranjera.", () => {
                mgmt.currency *= 2.0;
                if (mgmt.parallelCurrency) mgmt.parallelCurrency *= 1.85;
                mgmt.inflation += 12.0;
                mgmt.poverty += 4.5;
                mgmt.approval -= 6;
                mgmt.hidden.financialPressure += 15;
            })
        }
    ]);
}

function openCurrencyReconversionModal() {
    if (!mgmt) return;

    // Formato dinámico para el texto interno del modal
    const formatCurrencyVal = (val) => {
        if (!val || val <= 0) return "0.01";
        if (val < 10) return val.toFixed(2);
        return Math.round(val).toLocaleString('es-AR');
    };

    window.openModal("Reforma Monetaria: Quitar Ceros al Cono Monetario", [
        {
            label: `Cotización Actual: 1 USD = $${formatCurrencyVal(mgmt.currency)}`,
            sub: "Una reconversión monetaria reestructura la escala contable. Insume gasto operativo de impresión y distribución bancaria.",
            isTextOnly: true
        },
        {
            label: "Quitar 3 Ceros (Dividir por 1.000)",
            sub: `El tipo de cambio pasará a 1 USD = $${formatCurrencyVal(Math.max(0.01, mgmt.currency / 1000))}. Reordena la notación nominal de precios.`,
            tag: "Reconversión",
            tagClass: "tag-safe",
            action: () => spendSession("Reconversión Monetaria (-3 Ceros)", "Se suprimieron tres ceros de la moneda nacional, emitiendo un nuevo cono monetario.", () => {
                mgmt.currency = Math.max(0.01, mgmt.currency / 1000);
                if (mgmt.parallelCurrency) mgmt.parallelCurrency = Math.max(0.01, mgmt.parallelCurrency / 1000);
                if (mgmt.monetaryBase) mgmt.monetaryBase = Math.max(1000, mgmt.monetaryBase / 1000);
                spendCost(30000);
                mgmt.approval += 2.0;
                mgmt.reputation += 2.0;
            })
        },
        {
            label: "Quitar 6 Ceros (Reforma de Shock / Hiperinflación)",
            sub: `El tipo de cambio pasará a 1 USD = $${formatCurrencyVal(Math.max(0.01, mgmt.currency / 1000000))}. Reforma de emergencia para sanear balances y contabilidad.`,
            tag: "Shock",
            tagClass: "tag-cost",
            action: () => spendSession("Reconversión Masiva de Shock (-6 Ceros)", "Se eliminaron seis ceros del circulante para sanear la notación contable del país.", () => {
                mgmt.currency = Math.max(0.01, mgmt.currency / 1000000);
                if (mgmt.parallelCurrency) mgmt.parallelCurrency = Math.max(0.01, mgmt.parallelCurrency / 1000000);
                if (mgmt.monetaryBase) mgmt.monetaryBase = Math.max(100, mgmt.monetaryBase / 1000000);
                spendCost(45000);
                mgmt.approval += 3.0;
            })
        }
    ]);
}

function renderManagementActions(tab) {
    document.querySelectorAll('.mgmt-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mgmtTab === tab);
    });

    const p = document.getElementById('mgmt-action-panel');
    const chartsPanel = document.getElementById('mgmt-charts-panel');
    if (!p || !chartsPanel) return;

    if (tab === 'charts') {
        p.style.display = 'none';
        chartsPanel.style.display = 'flex';
        renderHistoryChart();
        return;
    } else {
        p.style.display = 'block';
        chartsPanel.style.display = 'none';
    }

    const f = mgmt.flags;
    const h = mgmt.hidden;
    let actions = {};

    if (tab === 'gestion') {
        actions = {
            'Economía Monetaria y Cambiaria': [
                {
                    title: "Fijación / Devaluación Manual de la Moneda",
                    desc: "Ajustar directamente la paridad cambiaria frente al dólar (Microdevaluación, 20% o Shock).",
                    execute: () => openManualDevaluationModal()
                },
                {
                    title: "Reconversión Monetaria: Quitar Ceros al Cono Monetario",
                    desc: "Crear un nuevo signo monetario quitando 3 o 6 ceros a la moneda nacional.",
                    execute: () => openCurrencyReconversionModal()
                },
                {
                    title: f.cepoCambiario ? "Levantar / Normalizar el Cepo Cambiario" : "Imponer Cepo y Restricciones Cambiarias",
                    desc: f.cepoCambiario ? "Liberar el mercado de divisas (Riesgo de corrida si no hay reservas)." : "Frenar la compra de moneda extranjera para blindar el Banco Central. Crea brecha cambiaria.",
                    execute: () => {
                        f.cepoCambiario = !f.cepoCambiario;
                        if (f.cepoCambiario) {
                            spendSession("Imposición de Cepo Cambiario", "Se bloquearon compras de dólares para contener la sangría de reservas.", () => {
                                mgmt.approval -= 2.5;
                                h.investment -= 6;
                                mgmt.exchangeGap = 18;
                            });
                        } else {
                            spendSession("Apertura del Cepo Cambiario", "Se desreguló el acceso a divisas.", () => {
                                if (mgmt.funds < 150000) {
                                    mgmt.currency *= 1.25;
                                    mgmt.inflation += 3.5;
                                    mgmt.approval -= 3;
                                } else {
                                    h.investment += 8;
                                    mgmt.approval += 2;
                                }
                                mgmt.exchangeGap = 0;
                            });
                        }
                    }
                },
                {
                    title: "Emisión Monetaria para Consumo Directo",
                    desc: "Inyección de circulante que dinamiza la calle pero devalúa la moneda a mediano plazo.",
                    execute: () => spendSession("Emisión de circulante", "Se imprimieron billetes para transferencias; repunte temporal con inflación.", () => {
                        mgmt.funds += 130000;
                        if (mgmt.monetaryBase) mgmt.monetaryBase += 1300000;
                        mgmt.poverty -= 1;
                        mgmt.currency *= 1.06;
                        mgmt.inflation += 1.8;
                    })
                },
                {
                    title: "Blanqueo General de Capitales y Moratoria Fiscal",
                    desc: "Ingreso extraordinario de fondos no declarados con alícuota reducida. Alivia la caja pero premia la evasión.",
                    execute: () => spendSession("Blanqueo de Capitales", "Ingresaron fondos no declarados a tesorería. Respiro de liquidez inmediata.", () => {
                        mgmt.funds += 160000;
                        mgmt.hidden.reserves = (mgmt.hidden.reserves || 50) + 15;
                        mgmt.reputation -= 3;
                    })
                },
                {
                    title: "Tomar Crédito Extraordinario con el FMI",
                    desc: "Desembolso masivo de reservas con imposición de metas fiscales estrictas.",
                    execute: () => spendSession("Acuerdo multilateral FMI", "Ingresaron reservas al Tesoro bajo tutela fiscal internacional.", () => {
                        mgmt.debt += 350000;
                        mgmt.funds += 320000;
                        mgmt.autonomy -= 5;
                    })
                }
            ],
            'Medidas Extremas y Riesgo Moral': [
                {
                    title: f.corralitoActive ? "Levantar Retención Bancaria (Fin de Corralito)" : "Decreto de 'Corralito': Retención y Bloqueo de Ahorros",
                    desc: f.corralitoActive ? "Normalizar retiros bancarios en ventanilla." : "Bloquear retiros bancarios para contener corridas. Otorga liquidez inmediata pero desata cacerolazos y furia social.",
                    execute: () => {
                        f.corralitoActive = !f.corralitoActive;
                        if (f.corralitoActive) {
                            spendSession("Corralito Bancario Promulgado", "Se retuvieron los ahorros en ventanilla. Cacerolazos masivos en los centros urbanos.", () => {
                                mgmt.funds += 220000;
                                mgmt.approval -= 14;
                                h.mobPressure = (h.mobPressure || 0) + 25;
                                h.institutionalTrust -= 22;
                            });
                        } else {
                            spendSession("Apertura de Ventanillas Bancarias", "Se liberaron los fondos retenidos normalizando transacciones.", () => {
                                spendCost(110000);
                                mgmt.approval += 3;
                            });
                        }
                    }
                },
                {
                    title: f.sovereignDefault ? "Reabrir Negociación de Deuda Externa" : "Declarar Moratoria Unilateral de Deuda (Default Soberano)",
                    desc: f.sovereignDefault ? "Reanudar pagos con acreedores y FMI." : "Suspender el pago de deuda externa y romper con acreedores. Ahorra partidas corrientes pero corta el crédito foráneo.",
                    execute: () => {
                        f.sovereignDefault = !f.sovereignDefault;
                        if (f.sovereignDefault) {
                            spendSession("Declaración de Default Soberano", "Se repudiaron los pagos a acreedores externos. Aislamiento comercial y sanciones crediticias.", () => {
                                mgmt.funds += 180000;
                                mgmt.autonomy += 8;
                                h.foreignHostility = (h.foreignHostility || 0) + 25;
                                h.investment -= 20;
                            });
                        } else {
                            spendSession("Reapertura de Negociación Externa", "Se firmó acuerdo preliminar de pago.", () => {
                                spendCost(90000);
                                h.foreignHostility = Math.max(0, (h.foreignHostility || 0) - 12);
                            });
                        }
                    }
                },
                {
                    title: f.universalSubsidy ? "Retirar Subsidio Universal a Bienes" : "Subsidio Total y Precios Fijos a Alimentos y Nafta",
                    desc: f.universalSubsidy ? "Restablecer precios reales de mercado." : "Tarifas casi gratuitas cubiertas por el Tesoro. Popularidad inmediata pero colapso fiscal y desabastecimiento.",
                    execute: () => {
                        f.universalSubsidy = !f.universalSubsidy;
                        if (f.universalSubsidy) {
                            spendSession("Subsidio Universal a Bienes de Consumo", "El Estado absorbe la brecha de precios en góndolas y combustible.", () => {
                                mgmt.approval += 7;
                                spendCost(140000);
                                mgmt.energy -= 15;
                            });
                        } else {
                            spendSession("Tarifazo por Fin de Subsidio Universal", "Las boletas y la canasta básica saltaron de precio de golpe.", () => {
                                mgmt.approval -= 9;
                                mgmt.poverty += 3.5;
                            });
                        }
                    }
                }
            ],
            'Infraestructura, Industria y Energía': [
                {
                    title: "Ampliación de Transporte Ferroviario",
                    desc: "Inversión federal para mejorar la conectividad y movilidad de cargas y pasajeros.",
                    execute: () => spendSession("Expansión ferroviaria", "Se asignaron fondos de tesorería para modernizar el tendido federal.", () => {
                        spendCost(85000);
                        mgmt.approval += 2.5;
                        mgmt.alloc.transport = Math.min(40, mgmt.alloc.transport + 2);
                    })
                },
                {
                    title: "Construcción de Universidades y Escuelas Técnicas",
                    desc: "Fortalece capital humano y reduce la pobreza estructural a largo plazo.",
                    execute: () => spendSession("Plan educativo federal", "Inversión pública en edificios universitarios y secundarios.", () => {
                        spendCost(80000);
                        mgmt.poverty -= 1.4;
                        mgmt.approval += 2.5;
                        mgmt.alloc.education = Math.min(40, mgmt.alloc.education + 2);
                    })
                },
                {
                    title: "Inversión Estratégica en Gasoductos y Red Eléctrica",
                    desc: "Obras públicas de energía para evitar apagones industriales y cortes en invierno.",
                    execute: () => spendSession("Plan Energético Nacional", "Inversión directa en transporte eléctrico y gasífero.", () => {
                        spendCost(75000);
                        mgmt.energy = Math.min(100, mgmt.energy + 12);
                        mgmt.industry += 3;
                    })
                },
                {
                    title: "Programa Compre Nacional y Protección Arancelaria",
                    desc: "Protección a la industria local mediante subsidios arancelarios a manufacturas.",
                    execute: () => spendSession("Proteccionismo nacional", "Se blindaron cadenas fabriles locales, generando malestar de importadores.", () => {
                        spendCost(40000);
                        mgmt.industry += 5;
                        mgmt.autonomy += 4;
                        mgmt.approval += 1.5;
                    })
                },
                {
                    title: "Régimen Especial de Incentivo a Grandes Inversiones (RIGI)",
                    desc: "Garantías tributarias y cambiarias por 30 años a megaproyectos. Atrae multinacionales pero indigna a la industria pyme local.",
                    execute: () => spendSession("Régimen de Grandes Inversiones", "Se otorgaron exenciones impositivas masivas para inversiones mineras y energéticas.", () => {
                        mgmt.funds += 110000;
                        h.investment += 12;
                        mgmt.autonomy -= 5;
                        mgmt.industry -= 2;
                    })
                }
            ],
            'Privatizaciones y Subsidios': [
                {
                    title: f.recursosEstatizados ? "Privatizar Concesiones de Litio/Energía" : "Estatizar Yacimientos Estratégicos (Litio/Energía)",
                    desc: f.recursosEstatizados ? "Restablecer capital privado para obtener fondos." : "Dominio estatal soberano sobre reservas minerales y energéticas.",
                    execute: () => {
                        f.recursosEstatizados = !f.recursosEstatizados;
                        if (f.recursosEstatizados) {
                            spendSession("Estatización de recursos", "Se nacionalizaron yacimientos energéticos; quejas de corporaciones.", () => {
                                mgmt.autonomy += 10;
                                mgmt.foreign -= 8;
                                h.investment -= 6;
                                h.foreignHostility = (h.foreignHostility || 0) + 12;
                                mgmt.approval += 2;
                            });
                        } else {
                            spendSession("Concesión privada minera", "Se vendieron concesiones a empresas extranjeras para engrosar reservas.", () => {
                                mgmt.funds += 110000;
                                mgmt.autonomy -= 8;
                                mgmt.foreign += 7;
                            });
                        }
                    }
                },
                {
                    title: f.bancaPrivatizada ? "Banca Pública Privatizada" : "Privatización de la Banca Pública Federal",
                    desc: f.bancaPrivatizada ? "El sistema financiero opera bajo bancos privados." : "Vender entidades financieras del Estado a consorcios privados.",
                    execute: () => {
                        if (f.bancaPrivatizada) return alert("La banca pública ya se encuentra privatizada.");
                        f.bancaPrivatizada = true;
                        spendSession("Privatización bancaria", "Se liquidaron entidades públicas ingresando $160.000 a tesorería.", () => {
                            mgmt.funds += 160000;
                            mgmt.autonomy -= 6;
                            mgmt.approval -= 2.5;
                        });
                    }
                },
                {
                    title: f.aerolineaPrivatizada ? "Aerolínea de Bandera Privatizada" : "Privatizar la Aerolínea y Telecomunicaciones",
                    desc: f.aerolineaPrivatizada ? "Operación comercial privada." : "Desprenderse de empresas de transporte y comunicaciones estatales.",
                    execute: () => {
                        if (f.aerolineaPrivatizada) return alert("La aerolínea ya fue entregada a manos privadas.");
                        f.aerolineaPrivatizada = true;
                        spendSession("Privatización aeronáutica", "Se entregó la aerolínea reduciendo subsidios y aumentando reservas.", () => {
                            mgmt.funds += 95000;
                            mgmt.autonomy -= 4;
                            mgmt.approval -= 1.8;
                        });
                    }
                },
                {
                    title: "Bono Extraordinario a Hogares Vulnerables",
                    desc: "Transferencia directa que alivia la indigencia pero drena reservas del Tesoro.",
                    execute: () => spendSession("Bono de emergencia", "Se giraron fondos a familias necesitadas reduciendo la pobreza.", () => {
                        spendCost(75000);
                        mgmt.poverty -= 2.2;
                        mgmt.approval += 2;
                    })
                },
                {
                    title: "Eliminar Subsidios a Tarifas de Servicios",
                    desc: "Ajuste tarifario que reduce el déficit fiscal pero genera enojo e inflación en boletas.",
                    execute: () => spendSession("Quita de subsidios", "Las boletas de servicios subieron sin cobertura del Estado.", () => {
                        mgmt.funds += 90000;
                        mgmt.poverty += 2.5;
                        mgmt.approval -= 3.5;
                    })
                }
            ]
        };
    } else if (tab === 'publica') {
        actions = {
            'Geopolítica, Diplomacia y Soberanía': [
                {
                    title: "Expulsar Embajadores de Potencias Mundiales",
                    desc: "Discurso incendiario contra potencias extranjeras y ruptura diplomática directa.",
                    execute: () => spendSession("Ruptura Diplomática con Potencias", "Se expulsaron delegaciones extranjeras acusándolas de colonialismo.", () => {
                        h.foreignHostility = (h.foreignHostility || 0) + 35;
                        mgmt.autonomy += 6;
                        mgmt.approval += (h.polarization > 40 ? 4 : -4);
                    })
                },
                {
                    title: "Incautación de Buques Mercantes Extranjeros",
                    desc: "Confiscar cargueros foráneos en puertos nacionales como represalia económica o de soberanía.",
                    execute: () => spendSession("Incautación de Buques Foráneos", "Se retuvieron buques extranjeros en muelles federales. Grave escalada militar.", () => {
                        mgmt.funds += 85000;
                        h.foreignHostility = (h.foreignHostility || 0) + 30;
                        mgmt.reputation -= 15;
                    })
                },
                {
                    title: "Cumbre con Corporaciones Tecnológicas",
                    desc: "Atracción de capitales foráneos a cambio de flexibilizar regulaciones.",
                    execute: () => spendSession("Cumbre tecnológica", "Se acordaron transferencias de divisas cediendo soberanía regulatoria.", () => {
                        mgmt.funds += 70000;
                        mgmt.foreign += 4;
                        mgmt.autonomy -= 3;
                        mgmt.approval += 1;
                    })
                },
                {
                    title: "Gira Multilateral en el Exterior",
                    desc: "Presentación del plan nacional en foros con riesgo de papelón diplomático.",
                    execute: () => spendSession("Gira diplomática", "Comitiva oficial expuso ante foros internacionales.", () => {
                        spendCost(25000);
                        if (rnd.next(0, 10) > 3) {
                            mgmt.approval += 2;
                        } else {
                            mgmt.approval -= 2.5;
                            mgmt.reputation -= 3;
                        }
                    })
                },
                {
                    title: "Tratado de Libre Comercio con Potencias",
                    desc: "Abre exportaciones pero incrementa la competencia importada.",
                    execute: () => spendSession("Tratado de libre comercio", "Apertura arancelaria que inundó el mercado de productos importados.", () => {
                        mgmt.foreign += 8;
                        mgmt.autonomy -= 4;
                        mgmt.gdp *= 1.01;
                        mgmt.funds += 40000;
                    })
                },
                {
                    title: "Pacto de Asistencia Militar Internacional por Divisas",
                    desc: "Alineamiento geopolítico foráneo a cambio de financiamiento de emergencia.",
                    execute: () => spendSession("Pacto de asistencia militar", "Se comprometió apoyo logístico internacional a cambio de liquidez.", () => {
                        mgmt.funds += 120000;
                        mgmt.foreign += 10;
                        mgmt.autonomy -= 7;
                    })
                },
                {
                    title: "Declarar Postura en Guerra Internacional",
                    desc: "Alineamiento geopolítico en un conflicto armado ajeno.",
                    execute: () => spendSession("Alineamiento bélico", "Se comprometió postura diplomática firme en conflicto ajeno.", () => {
                        mgmt.foreign += 4;
                        mgmt.autonomy -= 2;
                    })
                }
            ],
            'Actos Públicos, Discurso y Polarización': [
                {
                    title: "Acto Federal: Exposición del Plan de Gobierno",
                    desc: "Presentación técnica de logros y proyectos ante la ciudadanía.",
                    execute: () => spendSession("Acto programático", "Se presentó un balance de gestión institucional.", () => {
                        mgmt.approval += 2;
                        mgmt.reputation += 3;
                    })
                },
                {
                    title: "Acto de Confrontación: Culpar a Gestiones Previas",
                    desc: "Arenga política dura para consolidar el núcleo propio.",
                    execute: () => spendSession("Acto de polarización", "Discurso combativo contra la oposición que enfureció al centro.", () => {
                        mgmt.approval += 1;
                        mgmt.reputation -= 2;
                        h.polarization = (h.polarization || 0) + 5;
                    })
                },
                {
                    title: "Cadena Nacional de Denuncia contra Corporaciones Formadoras de Precios",
                    desc: "Ataque público directo a cadenas de supermercados por la inflación. Moviliza a la base pero espanta la inversión.",
                    execute: () => spendSession("Denuncia a Formadores de Precios", "Discurso frontal contra monopolios de alimentos.", () => {
                        mgmt.approval += 2.5;
                        h.investment -= 6;
                        h.polarization = (h.polarization || 0) + 4;
                    })
                }
            ],
            'Seguridad, Protesta y Derechos Civiles': [
                {
                    title: f.protestasProhibidas ? "Levantar Prohibición de Protestas" : "Imponer Protocolo Antipiquete y Prohibición",
                    desc: f.protestasProhibidas ? "Garantizar libre manifestación en la vía pública." : "Penalizar cortes de calles con intervención policial.",
                    execute: () => {
                        f.protestasProhibidas = !f.protestasProhibidas;
                        if (f.protestasProhibidas) {
                            spendSession("Protocolo antipiquete activado", "Se prohibieron las marchas en avenidas; tensión con organizaciones.", () => {
                                mgmt.approval += 1.5;
                                h.socialTension += 4;
                                h.mobPressure = (h.mobPressure || 0) + 10;
                            });
                        } else {
                            spendSession("Restablecimiento del derecho a protesta", "Se retiró a las fuerzas de seguridad de la vía pública.", () => {
                                mgmt.approval -= 1.0;
                                h.socialTension -= 2;
                                h.mobPressure = Math.max(0, (h.mobPressure || 0) - 5);
                            });
                        }
                    }
                },
                {
                    title: "Despliegue de Gendarmería en Zonas Críticas de Narcotráfico",
                    desc: "Fuerte presencia federal en puertos y barrios periféricos. Reduce el crimen pero aumenta la violencia operativa.",
                    execute: () => spendSession("Operativo de Seguridad Federal", "Fuerzas federales ocuparon puntos calientes urbanos.", () => {
                        spendCost(35000);
                        mgmt.approval += 2.5;
                        h.militaryLoyalty = (h.militaryLoyalty || 70) + 4;
                    })
                },
                {
                    title: "Sancionar Penalmente Discursos de la Oposición",
                    desc: "Persecución judicial que daña gravemente las libertades civiles.",
                    execute: () => spendSession("Censura política", "Se denunció a dirigentes opositores bajo cargos de sedición.", () => {
                        mgmt.approval -= 4;
                        mgmt.reputation -= 8;
                        h.institutionalTrust -= 6;
                    })
                },
                {
                    title: "Marco Federal de Protección a Minorías",
                    desc: "Penalización estricta ante la discriminación religiosa y étnica.",
                    execute: () => spendSession("Protección antidiscriminación", "Se aprobaron garantías ante crímenes de odio.", () => {
                        mgmt.reputation += 4;
                        mgmt.approval += 1.5;
                    })
                }
            ],
            'Régimen de Medios y Redes': [
                {
                    title: f.privateMediaBanned ? "Prensa Privada Confiscada (Monopolio Estatal)" : "Censurar y Confiscar Cadenas de Medios Privados",
                    desc: f.privateMediaBanned ? "Solo operan los canales oficiales del Estado." : "Cierre definitivo de conglomerados periodísticos privados (Una sola vez).",
                    execute: () => {
                        if (f.privateMediaBanned) return alert("Los medios privados ya fueron confiscados.");
                        f.privateMediaBanned = true;
                        spendSession("Clausura de medios privados", "Se tomó control estatal del espectro informativo con condena global.", () => {
                            mgmt.approval -= 8;
                            mgmt.reputation -= 16;
                            h.institutionalTrust -= 10;
                        });
                    }
                },
                {
                    title: f.socialNetworksBanned ? "Redes Foráneas Bloqueadas (Bloqueo Activo)" : "Bloquear Redes Sociales Foráneas",
                    desc: f.socialNetworksBanned ? "El tráfico occidental se encuentra interrumpido." : "Bloqueo de servidores extranjeros en nodos troncales de internet.",
                    execute: () => {
                        if (f.socialNetworksBanned) return alert("Las redes foráneas ya se encuentran dadas de baja.");
                        f.socialNetworksBanned = true;
                        spendSession("Bloqueo de plataformas digitales", "Se desconectaron servidores foráneos por seguridad nacional.", () => {
                            mgmt.approval -= 6;
                        });
                    }
                },
                {
                    title: f.redOficialCreada ? "Red Social Estatal Operativa" : "Crear Red Social Oficial del Estado",
                    desc: f.redOficialCreada ? "La plataforma digital pública se encuentra en funcionamiento." : "Despliegue informático público bajo supervisión oficial.",
                    execute: () => {
                        if (f.redOficialCreada) return alert("La red estatal ya se encuentra activa.");
                        f.redOficialCreada = true;
                        spendSession("Despliegue de red digital pública", "Se puso en línea la red oficial con servidores locales.", () => {
                            spendCost(70000);
                            mgmt.autonomy += 4;
                        });
                    }
                }
            ]
        };
    } else if (tab === 'gobierno') {
        actions = {
            'Conflicto Institucional, Plebiscitos y Gabinete': [
                {
                    title: "Plebiscito de Disolución del Congreso Nacional",
                    desc: "Convocar a consulta popular extraordinaria para clausurar el Congreso. Si se pierde, juicio político asegurado.",
                    execute: () => {
                        const apoyoPlebiscito = mgmt.approval + rnd.float(-8, 8);
                        if (apoyoPlebiscito >= 50) {
                            spendSession("Plebiscito Ganado: Cierre del Congreso", "La ciudadanía aprobó la disolución. El Ejecutivo gobierna por decreto.", () => {
                                mgmt.congress.deputies.government = 120;
                                mgmt.congress.senate.government = 36;
                                h.foreignHostility = (h.foreignHostility || 0) + 20;
                                h.institutionalTrust -= 25;
                            });
                        } else {
                            spendSession("Plebiscito Derrotado en las Urnas", "La ciudadanía rechazó la disolución parlamentaria. Juicio político inminente.", () => {
                                mgmt.approval -= 15;
                                h.institutionalTrust -= 30;
                                h.mobPressure = (h.mobPressure || 0) + 30;
                            });
                        }
                    }
                },
                {
                    title: "Pacto de Coparticipación Fiscal con los Gobernadores",
                    desc: "Girar partidas discrecionales a las provincias a cambio de que sus legisladores apoyen leyes clave.",
                    execute: () => spendSession("Pacto Federal con Provincias", "Se firmó el acuerdo fiscal con los 12 distritos federales.", () => {
                        spendCost(65000);
                        mgmt.governorsLoyalty = Math.min(100, (mgmt.governorsLoyalty || 50) + 25);
                        mgmt.congress.deputies.dialog += 6;
                    })
                },
                {
                    title: "Crear Nuevos Ministerios de DDHH y Género",
                    desc: "Amplía la estructura de derechos con mayor costo presupuestario.",
                    execute: () => spendSession("Creación ministerial", "Se ampliaron áreas de garantías sociales con nuevos cargos públicos.", () => {
                        spendCost(50000);
                        mgmt.approval += 1.5;
                    })
                },
                {
                    title: "Cerrar Ministerios para Reducir Estructura",
                    desc: "Suprime secretarías para achicar la planta del Estado.",
                    execute: () => spendSession("Ajuste de gabinete", "Se eliminaron dependencias para reducir el costo burocrático.", () => {
                        mgmt.funds += 40000;
                        mgmt.approval -= 1.5;
                    })
                }
            ],
            'Decretos de Necesidad y Urgencia (DNU)': [
                {
                    title: "DNU de Desregulación Económica y Derogación de Trámites",
                    desc: "Eliminación masiva de licencias de comercio, alquileres y aduanas por decreto.",
                    execute: () => spendSession("DNU de Desregulación Total", "Se desregularon mercados eliminando controles estatales.", () => {
                        h.investment += 10;
                        mgmt.gdp *= 1.015;
                        if (typeof checkSupremeCourtJudicialReview === 'function') {
                            checkSupremeCourtJudicialReview("DNU de Desregulación Económica");
                        }
                    })
                },
                {
                    title: "DNU de Blindaje a los Derechos Humanos",
                    desc: "Garantías civiles universales sin trámite parlamentario.",
                    execute: () => spendSession("DNU de derechos humanos", "Se promulgaron garantías civiles directas por decreto.", () => {
                        mgmt.reputation += 5;
                        mgmt.approval += 1;
                    })
                },
                {
                    title: "DNU de Privatización de Concesiones Portuarias",
                    desc: "Concesión de puertos a capital privado a cambio de divisas.",
                    execute: () => spendSession("DNU de privatización portuaria", "Se entregó la operación portuaria reduciendo la autonomía.", () => {
                        mgmt.funds += 180000;
                        mgmt.autonomy -= 12;
                        if (typeof checkSupremeCourtJudicialReview === 'function') {
                            checkSupremeCourtJudicialReview("DNU de Privatización Portuaria");
                        }
                    })
                },
                {
                    title: f.priceFreezeActive ? "Derogar DNU de Congelamiento de Precios" : "DNU de Congelamiento de Precios y Tarifas",
                    desc: f.priceFreezeActive ? "Liberar los precios en góndolas y servicios." : "Fijación estricta de canasta básica y energía.",
                    execute: () => {
                        f.priceFreezeActive = !f.priceFreezeActive;
                        if (f.priceFreezeActive) {
                            spendSession("DNU de precios congelados", "Se intervinieron precios de alimentos; freno inflacionario.", () => {
                                mgmt.inflation = Math.max(1, mgmt.inflation - 2);
                                h.investment -= 5;
                                mgmt.approval += 2;
                            });
                        } else {
                            spendSession("Derogación de controles de precios", "Se desregularon los precios en góndolas.", () => {
                                mgmt.inflation += 2;
                                h.investment += 4;
                            });
                        }
                    }
                }
            ],
            'Proyectos de Ley al Congreso': [
                {
                    title: f.leyLaboralAprobada ? "Ley de Reforma Laboral (Vigente)" : "Ley de Reforma y Flexibilización Laboral",
                    desc: f.leyLaboralAprobada ? "El régimen flexible se encuentra en aplicación." : "Somete a votación en ambas cámaras el nuevo régimen de contratación.",
                    execute: () => {
                        if (f.leyLaboralAprobada) return alert("La ley de reforma laboral ya fue sancionada.");
                        submitBill("Reforma Laboral", () => {
                            f.leyLaboralAprobada = true;
                            mgmt.gdp *= 1.02;
                            mgmt.unemployment += 2;
                        });
                    }
                },
                {
                    title: f.propiedadPrivadaBlindada ? "Blindaje de Propiedad Privada (Vigente)" : "Ley de Blindaje a la Propiedad Privada",
                    desc: f.propiedadPrivadaBlindada ? "La propiedad cuenta con tutela judicial máxima." : "Garantías inviolables para atraer capitales foráneos.",
                    execute: () => {
                        if (f.propiedadPrivadaBlindada) return alert("La propiedad privada ya cuenta con blindaje legal.");
                        submitBill("Propiedad Privada", () => {
                            f.propiedadPrivadaBlindada = true;
                            mgmt.foreign += 6;
                            mgmt.approval += 2;
                        });
                    }
                },
                {
                    title: "Ley de Reforma Tributaria y Simplificación Impositiva",
                    desc: "Eliminación de impuestos distorsivos y baja de alícuotas para formalizar la economía.",
                    execute: () => submitBill("Reforma Tributaria", () => {
                        mgmt.industry += 6;
                        h.investment += 8;
                        spendCost(25000);
                    })
                },
                {
                    title: "Ley de Extinción de Dominio y Recupero de Corrupción",
                    desc: "Incautación rápida de bienes mal habidos por funcionarios corruptos. Alto impacto en credibilidad institucional.",
                    execute: () => submitBill("Extinción de Dominio", () => {
                        mgmt.funds += 60000;
                        mgmt.reputation += 8;
                        mgmt.approval += 3;
                    })
                },
                {
                    title: "Ley de Baja de Edad de Imputabilidad y Reforma Penal",
                    desc: "Endurecimiento de penas a delitos graves. Respaldo de sectores duros y rechazo de organismos de derechos humanos.",
                    execute: () => submitBill("Reforma Penal Juvenil", () => {
                        mgmt.approval += 2;
                        h.militaryLoyalty = (h.militaryLoyalty || 70) + 5;
                        h.polarization = (h.polarization || 0) + 4;
                    })
                },
                {
                    title: "Proyecto de Reforma del Sistema Electoral (Boleta Única de Papel)",
                    desc: "Sustituye la boleta partidaria tradicional por boleta única transparente.",
                    execute: () => submitBill("Boleta Única Electoral", () => {
                        mgmt.reputation += 6;
                        mgmt.approval += 1.5;
                    })
                },
                {
                    title: "Ley Antimonopolio de Medios",
                    desc: "Desconcentración de licencias informativas en el país.",
                    execute: () => submitBill("Regulación Antimonopólica", () => {
                        mgmt.reputation += 4;
                        h.polarization = (h.polarization || 0) + 3;
                    })
                }
            ]
        };
    }

    let html = '';
    Object.entries(actions).forEach(([sub, items]) => {
        html += `<div style="color:var(--accent-blue); font-size:0.75rem; font-weight:700; text-transform:uppercase; margin:6px 0 3px 0;">${sub}</div><div class="action-grid">`;
        items.forEach((item, idx) => {
            html += `
                <div class="action-card" data-sub="${sub}" data-idx="${idx}">
                    <div class="action-title">${item.title}</div>
                    <div class="action-desc">${item.desc}</div>
                </div>
            `;
        });
        html += `</div>`;
    });
    p.innerHTML = html;

    p.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', () => {
            p.querySelectorAll('.action-card').forEach(c => c.classList.remove('action-card-selected'));
            card.classList.add('action-card-selected');
            const sub = card.dataset.sub;
            const idx = parseInt(card.dataset.idx, 10);
            requestActionConfirmation(actions[sub][idx]);
        });
    });
}

// Escuchadores de interfaz
document.querySelectorAll('.mgmt-tab-btn[data-mgmt-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.mgmtTab;
        renderManagementActions(tab);
    });
});

safeOn('btn-mgmt-survey', 'click', () => {
    if (!mgmt) return;
    const est = clamp(mgmt.approval * 0.9 + rnd.float(-3, 3), 5, 95);
    const rechazo = clamp(100 - est - rnd.float(2, 6), 5, 95);
    const indecisos = clamp(100 - est - rechazo, 0, 30);

    window.openModal("Sondeo de Opinión Pública Nacional", [
        {
            label: `Imagen Positiva: ${est.toFixed(1)}%`,
            sub: "Nivel de respaldo a las directivas del Poder Ejecutivo.",
            tag: "Aprobación",
            tagClass: "tag-safe",
            action: () => {}
        },
        {
            label: `Imagen Negativa: ${rechazo.toFixed(1)}%`,
            sub: "Rechazo concentrado ante medidas de ajuste o tensión social.",
            tag: "Rechazo",
            tagClass: "tag-risk",
            action: () => {}
        },
        {
            label: `Indecisos / Sin Postura: ${indecisos.toFixed(1)}%`,
            sub: "Margen de volatilidad de cara a los próximos comicios.",
            tag: "Indecisos",
            tagClass: "tag-cost",
            action: () => {}
        }
    ]);
});