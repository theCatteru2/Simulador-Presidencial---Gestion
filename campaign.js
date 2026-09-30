// UTILIDADES Y ENLAZADOR SEGURO
function safeOn(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

const rnd = {
    next: (min, max) => Math.floor(Math.random() * (max - min)) + min,
    float: (min, max) => (Math.random() * (max - min) + min)
};

function money(v) { return '$' + Math.round(v).toLocaleString('es-AR'); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

const creadorJuego = "Joirent";
let nombreCandidato = "Candidata";

let modoFacil = false;
let factorEficacia = 1.0;
let multiplicadorGasto = 1.15;

const PARTY_COLORS = {
    government: '#38bdf8',
    dialog: '#a855f7',
    opposition: '#ef4444'
};

const DISTRITOS_FEDERALES = [
    { name: "Distrito Central", weight: 36 },
    { name: "Distrito Norte", weight: 9 },
    { name: "Distrito Oeste", weight: 8 },
    { name: "Distrito Capital", weight: 7 },
    { name: "Distrito Sur", weight: 5 },
    { name: "Distrito del Valle", weight: 5 },
    { name: "Distrito del Rio", weight: 4 },
    { name: "Distrito Frontera", weight: 4 },
    { name: "Distrito Minero", weight: 4 },
    { name: "Distrito Austral", weight: 4 },
    { name: "Distrito del Campo", weight: 3 },
    { name: "Distrito Insular", weight: 2 }
];

function showScreen(key) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    let targetId = key.startsWith('screen-') ? key : 'screen-' + key;
    let target = document.getElementById(targetId) || document.getElementById(key);
    if (target) {
        target.classList.add('active');
        target.scrollTop = 0;
    }

    const badge = document.getElementById('stage-badge');
    if (badge) {
        if (key.includes('management')) badge.textContent = "MODO GESTIÓN";
        else if (key.includes('dashboard')) updateStageBadge();
        else if (key.includes('midterms')) badge.textContent = "MEDIO TÉRMINO";
        else if (key.includes('presidential')) badge.textContent = "ELECCIÓN GENERAL";
        else badge.textContent = "SISTEMA";
    }
}

// CONTROL DE MODALES
const modal = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

function openModal(title, buttonsConfig) {
    if (!modal || !modalTitle || !modalBody) return;
    modalTitle.textContent = title;
    modalBody.innerHTML = '';
    buttonsConfig.forEach(cfg => {
        const btn = document.createElement('button');
        btn.className = 'btn-sub';
        btn.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <strong>${cfg.label}</strong>
                ${cfg.tag ? `<span class="${cfg.tagClass}">${cfg.tag}</span>` : ''}
            </div>
            <span style="font-size:0.72rem; color:var(--text-dim);">${cfg.sub || ''}</span>
        `;
        btn.onclick = () => {
            closeModal();
            if (typeof cfg.action === 'function') cfg.action();
        };
        modalBody.appendChild(btn);
    });
    modal.classList.add('active');
}

function closeModal() { 
    if (modal) modal.classList.remove('active'); 
}

safeOn('btn-modal-cancel', 'click', closeModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// NAVEGACIÓN PRINCIPAL
safeOn('btn-home-campaign', 'click', () => showScreen('diff-select'));
safeOn('btn-home-management', 'click', () => {
    managementFromCampaign = false;
    const inputCand = document.getElementById('input-management-candidate');
    if (inputCand) inputCand.value = '';
    selectedInitialSpeech = '';
    showScreen('management-setup');
});
safeOn('btn-home-congress', 'click', () => showInitialCongress());
safeOn('btn-home-rules', 'click', () => showScreen('rules'));
safeOn('btn-rules-back', 'click', () => showScreen('home'));

safeOn('btn-diff-easy', 'click', () => {
    modoFacil = true; factorEficacia = 1.6; multiplicadorGasto = 1.0;
    showScreen('register');
});
safeOn('btn-diff-real', 'click', () => {
    modoFacil = false; factorEficacia = 1.0; multiplicadorGasto = 1.15;
    showScreen('register');
});
safeOn('btn-diff-cancel', 'click', () => showScreen('home'));

safeOn('btn-register-submit', 'click', () => {
    const inp = document.getElementById('input-candidate');
    const val = inp ? inp.value.trim() : '';
    if (val.length < 3) return alert("El nombre debe tener al menos 3 caracteres.");
    nombreCandidato = val;
    startCampaign();
});
