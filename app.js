/*
  app.js — CAU Digital
  Lógica principal: estado del servicio + próximos trenes (mock)
*/

// =============================================
// SUPABASE CONFIG
// =============================================
const SUPABASE_URL = "https://rymhpvztvfxvqekpkkiz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bWhwdnp0dmZ4dnFla3Bra2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTc0MzcsImV4cCI6MjA4OTE3MzQzN30.j6ByiWhOzEWDa2weIahxvRy-6YTY8fQ0W3ISyZNIK6Q";

async function supabaseInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

async function supabaseSelect(table, filter = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&order=created_at.desc`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// =============================================
// REFERENCIAS AL DOM
// =============================================

const badge       = document.getElementById("badge");
const statusText  = document.getElementById("statusText");
const infoText    = document.getElementById("infoText");
const etaText     = document.getElementById("etaText");
const tipText     = document.getElementById("tipText");
const lastUpdate  = document.getElementById("lastUpdate");
const scenarioSelect = document.getElementById("scenarioSelect");
const moreInfoLink   = document.getElementById("moreInfoLink");

// Pantallas
const homeScreen   = document.getElementById("homeScreen");
const tripScreen   = document.getElementById("tripScreen");
const accessScreen = document.getElementById("accessScreen");
const claimScreen  = document.getElementById("claimScreen");

// Navegación
const ctaTrip              = document.getElementById("ctaTrip");
const ctaAccess            = document.getElementById("ctaAccess");
const ctaClaimBtn          = document.getElementById("ctaClaim");
const backHomeBtn          = document.getElementById("backHomeBtn");
const backHomeFromAccessBtn = document.getElementById("backHomeFromAccessBtn");
const backHomeFromClaimBtn = document.getElementById("backHomeFromClaimBtn");

// Viaje
const originSelect      = document.getElementById("originSelect");
const destinationSelect = document.getElementById("destinationSelect");
const tripDate          = document.getElementById("tripDate");
const tripTime          = document.getElementById("tripTime");
const searchTrainsBtn   = document.getElementById("searchTrainsBtn");
const nextTrainsBox     = document.getElementById("nextTrainsBox");
const nextTrainsList    = document.getElementById("nextTrainsList");
const trainsUpdated     = document.getElementById("trainsUpdated");
const trainsFromLabel   = document.getElementById("trainsFromLabel");
const tripAlert         = document.getElementById("tripAlert");
const tripAlertText     = document.getElementById("tripAlertText");
const tripEmpty         = document.getElementById("tripEmpty");

// =============================================
// CUSTOM SELECT — Origen / Destino
// =============================================

const STATION_LIST = [
  { value: "lemos",            label: "Gral. Lemos" },
  { value: "cabral",           label: "Sargento Cabral" },
  { value: "campo_mayo",       label: "Campo de Mayo" },
  { value: "agneta",           label: "Teniente Agneta" },
  { value: "lozano",           label: "Capitán Lozano" },
  { value: "barrufaldi",       label: "Sargento Barrufaldi" },
  { value: "lasalle",          label: "Juan B. de La Salle" },
  { value: "ejercito",         label: "Ejército de los Andes" },
  { value: "ruben_dario",      label: "Rubén Darío" },
  { value: "newbery",          label: "Jorge Newbery" },
  { value: "podesta",          label: "Pablo Podestá" },
  { value: "coronado",         label: "Martín Coronado" },
  { value: "bosch",            label: "José M. Bosch" },
  { value: "trapezon",         label: "Tropezón" },
  { value: "lourdes",          label: "Lourdes" },
  { value: "fernandez_moreno", label: "Fernández Moreno" },
  { value: "lynch",            label: "Cnel. Fco. Lynch" },
  { value: "devoto",           label: "Antonio Devoto" },
  { value: "libertador",       label: "El Libertador" },
  { value: "beiró",            label: "Dr. Francisco Beiró" },
  { value: "arata",            label: "Pedro N. Arata" },
  { value: "artigas",          label: "José Artigas" },
  { value: "lacroze",          label: "Federico Lacroze" },
];

function buildCustomSelect(wrapperId, dropdownId, triggerId, valueId, hiddenId, otherHiddenId, otherValueId, otherDropdownId) {
  const wrapper   = document.getElementById(wrapperId);
  const dropdown  = document.getElementById(dropdownId);
  const trigger   = document.getElementById(triggerId);
  const valueEl   = document.getElementById(valueId);
  const hidden    = document.getElementById(hiddenId);

  function renderOptions() {
    const otherVal = document.getElementById(otherHiddenId)?.value || "";
    dropdown.innerHTML = STATION_LIST.map(st => {
      const isSelected = hidden.value === st.value;
      const isDisabled = st.value === otherVal;
      return `<div class="cs-option${isSelected ? " selected" : ""}${isDisabled ? " disabled" : ""}" data-value="${st.value}">${st.label}</div>`;
    }).join("");

    dropdown.querySelectorAll(".cs-option:not(.disabled)").forEach(opt => {
      opt.addEventListener("click", () => {
        hidden.value    = opt.dataset.value;
        valueEl.textContent = opt.textContent;
        valueEl.classList.remove("placeholder");
        wrapper.classList.remove("open");
        // Re-render the other dropdown to disable this selection
        renderOtherOptions(otherDropdownId, otherHiddenId, otherValueId, hidden.value);
      });
    });
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = wrapper.classList.contains("open");
    document.querySelectorAll(".custom-select.open").forEach(el => el.classList.remove("open"));
    if (!isOpen) {
      renderOptions();
      wrapper.classList.add("open");
    }
  });

  // Init placeholder
  valueEl.classList.add("placeholder");
}

function renderOtherOptions(dropdownId, hiddenId, valueId, excludeValue) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown.parentElement.classList.contains("open")) return;
  const hidden   = document.getElementById(hiddenId);
  dropdown.querySelectorAll(".cs-option").forEach(opt => {
    if (opt.dataset.value === excludeValue) {
      opt.classList.add("disabled");
    } else {
      opt.classList.remove("disabled");
    }
  });
}

// Close on outside click
document.addEventListener("click", () => {
  document.querySelectorAll(".custom-select.open").forEach(el => el.classList.remove("open"));
});

buildCustomSelect(
  "originSelectWrapper", "originDropdown", "originTrigger", "originValue", "originSelect",
  "destinationSelect", "destinationValue", "destinationDropdown"
);
buildCustomSelect(
  "destinationSelectWrapper", "destinationDropdown", "destinationTrigger", "destinationValue", "destinationSelect",
  "originSelect", "originValue", "originDropdown"
);

// Accesibilidad
const stationsList = document.getElementById("stationsList");
const chips        = document.querySelectorAll(".chip");

// Reclamos — referencias básicas (el resto se maneja inline en la sección de reclamos)
const sendClaimBtn_unused = null; // manejado en sección reclamos


// =============================================
// ESCENARIOS DE SERVICIO
// =============================================

const SCENARIOS = {
  normal: {
    badgeLabel: "NORMAL",
    badgeTone: "ok",
    status: "Servicio Normal",
    info: "Circulación habitual en toda la línea.",
    eta: "Sin demoras reportadas.",
    tip: "Podés viajar con normalidad.",
    delayMinutes: 0,
    cancelled: false,
    modalEyebrow: "¿Sabías que...?",
    modalMessage: null, // usa curiosidad aleatoria
  },
  demorado: {
    badgeLabel: "DEMORADO",
    badgeTone: "warn",
    status: "Servicio con Demoras",
    info: "Congestión operativa en hora pico.",
    eta: "Demoras de 10 a 15 min.",
    tip: "Te recomendamos salir con anticipación.",
    delayMinutes: 12,
    cancelled: false,
    modalEyebrow: "Información del servicio",
    modalMessage: "El servicio funciona con demoras por exceso de pasaje. Te pedimos disculpas.",
  },
  interrumpido: {
    badgeLabel: "INTERRUMPIDO",
    badgeTone: "bad",
    status: "Servicio Interrumpido",
    info: "Interrupción total por accidente en la estación Artigas.",
    eta: "Normalización estimada: de 2 a 3 horas.",
    tip: "Te conviene buscar otro medio de transporte.",
    delayMinutes: 0,
    cancelled: true,
    modalEyebrow: "Información del servicio",
    modalMessage: "El servicio se encuentra interrumpido por accidente. Personal de bomberos, policía y nuestros colaboradores se encuentran trabajando en el lugar para restablecer el servicio.",
  },
};

function nowPretty() {
  const d  = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function applyScenario(key) {
  const data = SCENARIOS[key] ?? SCENARIOS.normal;
  badge.textContent = data.badgeLabel;
  badge.classList.remove("ok", "warn", "bad");
  badge.classList.add(data.badgeTone);
  statusText.textContent = data.status;
  infoText.textContent   = data.info;
  etaText.textContent    = data.eta;
  tipText.textContent    = data.tip;
  lastUpdate.textContent = nowPretty();

  // Si hay una estación seleccionada en viaje, actualizamos trenes
  if (originSelect && originSelect.value) {
    renderNextTrains(originSelect.value);
  }
}

scenarioSelect.addEventListener("change", (e) => applyScenario(e.target.value));
// =============================================
// CURIOSIDADES — modal "Ver más"
// =============================================

const CURIOSIDADES = [
  "La Línea Urquiza tiene 23 estaciones distribuidas a lo largo de todo su recorrido.",
  "Para que un solo tren circule, se necesitan más de 100 colaboradores trabajando en simultáneo: auxiliares de estación, señaleros, equipos de mantenimiento, personal de tráfico, boleteros y policías, entre otros.",
  "La línea recorre 25,5 kilómetros desde Federico Lacroze hasta General Lemos.",
  "La Línea Urquiza conecta la Ciudad de Buenos Aires con los partidos de San Martín, Hurlingham y San Miguel.",
  "En un día hábil, la Línea Urquiza transporta alrededor de 75.000 pasajeros.",
  "Con CAUdigital podés ver el estado del servicio antes de salir de casa.",
  "Desde esta app podés planificar tu viaje desde cualquier estación hacia cualquier otra.",
  "Con CAUdigital podés hacer una queja o sugerencia en menos de 2 minutos, sin llamadas ni filas.",
  "La Línea Urquiza une el corazón de Buenos Aires con el oeste del Conurbano, conectando cientos de miles de familias todos los días.",
  "En un día de trabajo normal, más de 500 colaboradores trabajan en simultáneo para que la Línea Urquiza funcione.",
];

function getRandomCuriosity() {
  return CURIOSIDADES[Math.floor(Math.random() * CURIOSIDADES.length)];
}

const curiosityModal = document.getElementById("curiosityModal");
const modalText      = document.getElementById("modalText");
const modalClose     = document.getElementById("modalClose");

moreInfoLink.addEventListener("click", (e) => {
  e.preventDefault();
  const scenario = SCENARIOS[scenarioSelect.value] ?? SCENARIOS.normal;
  const eyebrow  = document.getElementById("modalEyebrow");
  if (eyebrow) eyebrow.textContent = scenario.modalEyebrow;
  modalText.textContent = scenario.modalMessage ?? getRandomCuriosity();
  curiosityModal.style.display = "flex";
  document.body.style.overflow = "hidden";
});

if (modalClose) {
  modalClose.addEventListener("click", () => {
    curiosityModal.style.display = "none";
    document.body.style.overflow = "";
  });
}

// Cerrar clickeando el overlay
if (curiosityModal) {
  curiosityModal.addEventListener("click", (e) => {
    if (e.target === curiosityModal) {
      curiosityModal.style.display = "none";
      document.body.style.overflow = "";
    }
  });
}

applyScenario("normal");


// =============================================
// PRÓXIMOS TRENES — MOCK DATA
// =============================================

/*
  Horarios base por estación (hacia Lacroze y hacia Lemos).
  En la realidad esto vendría de una API.
  Generamos trenes cada ~12 minutos a partir de la hora actual.
*/

const STATION_NAMES = {
  lacroze:         "Federico Lacroze",
  artigas:         "José Artigas",
  arata:           "Pedro N. Arata",
  beiró:           "Dr. Francisco Beiró",
  libertador:      "El Libertador",
  devoto:          "Antonio Devoto",
  lynch:           "Cnel. Fco. Lynch",
  fernandez_moreno:"Fernández Moreno",
  lourdes:         "Lourdes",
  trapezon:        "Tropezón",
  bosch:           "José M. Bosch",
  coronado:        "Martín Coronado",
  podesta:         "Pablo Podestá",
  newbery:         "Jorge Newbery",
  ruben_dario:     "Rubén Darío",
  ejercito:        "Ejército de los Andes",
  lasalle:         "Juan B. de La Salle",
  barrufaldi:      "Sargento Barrufaldi",
  lozano:          "Capitán Lozano",
  agneta:          "Teniente Agneta",
  campo_mayo:      "Campo de Mayo",
  cabral:          "Sargento Cabral",
  lemos:           "Gral. Lemos",
};

// Orden de la línea Lacroze → Lemos
const LINE_ORDER = [
  "lacroze","artigas","arata","beiró","libertador","devoto",
  "lynch","fernandez_moreno","lourdes","trapezon","bosch",
  "coronado","podesta","newbery","ruben_dario","ejercito",
  "lasalle","barrufaldi","lozano","agneta","campo_mayo","cabral","lemos"
];

// Minutos aproximados entre estaciones consecutivas
const SEGMENT_TIMES = {
  lacroze_artigas:           3,
  artigas_arata:             2,
  arata_beiró:               2,
  beiró_libertador:          2,
  libertador_devoto:         2,
  devoto_lynch:              2,
  lynch_fernandez_moreno:    2,
  fernandez_moreno_lourdes:  2,
  lourdes_trapezon:          3,
  trapezon_bosch:            3,
  bosch_coronado:            3,
  coronado_podesta:          3,
  podesta_newbery:           3,
  newbery_ruben_dario:       3,
  ruben_dario_ejercito:      3,
  ejercito_lasalle:          3,
  lasalle_barrufaldi:        3,
  barrufaldi_lozano:         3,
  lozano_agneta:             3,
  agneta_campo_mayo:         4,
  campo_mayo_cabral:         4,
  cabral_lemos:              4,
};

// Andenes por estación y dirección
const STATION_PLATFORMS = {
  lemos:           { toLacroze: "Andén 1", toLemos: "Andén 2" },
  cabral:          { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  campo_mayo:      { toLacroze: "Andén central · lado Lacroze", toLemos: "Andén central · lado Lemos" },
  agneta:          { toLacroze: "Andén central · lado Lacroze", toLemos: "Andén central · lado Lemos" },
  lozano:          { toLacroze: "Andén central · lado Lacroze", toLemos: "Andén central · lado Lemos" },
  barrufaldi:      { toLacroze: "Andén central · lado Lacroze", toLemos: "Andén central · lado Lemos" },
  lasalle:         { toLacroze: "Andén central · lado Lacroze", toLemos: "Andén central · lado Lemos" },
  ejercito:        { toLacroze: "Andén central · lado Lacroze", toLemos: "Andén central · lado Lemos" },
  ruben_dario:     { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  newbery:         { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  podesta:         { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  coronado:        { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos · vía 4ta" },
  bosch:           { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  trapezon:        { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  lourdes:         { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  fernandez_moreno:{ toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  lynch:           { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  devoto:          { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  libertador:      { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  beiró:           { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  arata:           { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  artigas:         { toLacroze: "Andén a Lacroze", toLemos: "Andén a Lemos" },
  lacroze:         { toLacroze: "Andenes 2, 3, 4, 5, 6, 7", toLemos: "Andenes 2, 3, 4, 5, 6, 7" },
};

function getPlatform(stationKey, direction) {
  const p = STATION_PLATFORMS[stationKey];
  if (!p) return "";
  return direction === "asc" ? p.toLemos : p.toLacroze;
}

function travelTime(originKey, destKey) {
  const oIdx = LINE_ORDER.indexOf(originKey);
  const dIdx = LINE_ORDER.indexOf(destKey);
  if (oIdx === -1 || dIdx === -1 || oIdx === dIdx) return null;
  const from = Math.min(oIdx, dIdx);
  const to   = Math.max(oIdx, dIdx);
  let total  = 0;
  for (let i = from; i < to; i++) {
    const seg = `${LINE_ORDER[i]}_${LINE_ORDER[i+1]}`;
    total += SEGMENT_TIMES[seg] || 5;
  }
  return total;
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60000);
}

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDateShort(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function minutesLabel(min) {
  if (min <= 1) return "Llegando";
  if (min < 60) return `en ${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `en ${h}h ${m}min` : `en ${h}h`;
}

// ─── HORARIOS REALES ──────────────────────────────────────────────────────────

const SCHEDULES = {
  lav: {
    to_lemos: [
      "00:00","02:35","03:25","04:15",
      "05:01","05:11","05:21","05:31","05:41","05:51",
      "06:01","06:11","06:21","06:31","06:38","06:46","06:54",
      "07:02","07:10","07:18","07:26","07:34","07:42","07:50","07:57",
      "08:04","08:11","08:18","08:24","08:31","08:37","08:44","08:50","08:57",
      "09:03","09:10","09:17","09:24","09:31","09:38","09:45","09:52","09:59",
      "10:06","10:13","10:20","10:27","10:34","10:41","10:48","10:55",
      "11:02","11:09","11:16","11:23","11:30","11:37","11:44","11:51","11:58",
      "12:05","12:12","12:19","12:26","12:33","12:40","12:47","12:54",
      "13:01","13:08","13:15","13:22","13:29","13:36","13:43","13:50","13:57",
      "14:04","14:11","14:18","14:25","14:32","14:39","14:46","14:53",
      "15:00","15:07","15:14","15:21","15:28","15:35","15:42","15:49","15:56",
      "16:01","16:07","16:13","16:20","16:27","16:34","16:41","16:48","16:55",
      "17:02","17:09","17:16","17:22","17:29","17:36","17:43","17:50","17:57",
      "18:03","18:09","18:15","18:21","18:28","18:35","18:42","18:49","18:56",
      "19:02","19:09","19:16","19:23","19:30","19:37","19:44","19:51","19:58",
      "20:05","20:13","20:22","20:31","20:40","20:49","20:58",
      "21:07","21:16","21:25","21:35","21:45","21:55",
      "22:05","22:15","22:25","22:35","22:45","22:55",
      "23:05","23:25","23:55"
    ],
    to_lacroze: [
      "01:00","02:30","03:25","04:35","04:45",
      "05:00","05:10","05:20","05:30","05:40","05:50",
      "06:00","06:10","06:20","06:30","06:38","06:46","06:54",
      "07:01","07:08","07:15","07:22","07:29","07:36","07:43","07:50","07:57",
      "08:04","08:11","08:17","08:24","08:30","08:36","08:43","08:49","08:55",
      "09:02","09:08","09:15","09:21","09:28","09:34","09:41","09:47","09:54",
      "10:00","10:07","10:14","10:21","10:27","10:34","10:40","10:47","10:54",
      "11:00","11:07","11:13","11:20","11:27","11:33","11:40","11:47","11:54",
      "12:00","12:07","12:14","12:21","12:27","12:34","12:41","12:48","12:54",
      "13:01","13:08","13:15","13:21","13:28","13:35","13:41","13:48","13:55",
      "14:01","14:08","14:15","14:22","14:28","14:35","14:42","14:48","14:55",
      "15:01","15:08","15:14","15:21","15:28","15:34","15:41","15:47","15:54",
      "16:00","16:06","16:12","16:19","16:26","16:33","16:40","16:47","16:54",
      "17:01","17:08","17:15","17:22","17:29","17:36","17:43","17:50","17:57",
      "18:03","18:09","18:15","18:21","18:28","18:35","18:42","18:49","18:56",
      "19:01","19:08","19:14","19:21","19:28","19:35","19:42","19:49","19:56",
      "20:03","20:11","20:20","20:29","20:38","20:47","20:56",
      "21:05","21:15","21:25","21:35","21:45","21:55",
      "22:05","22:15","22:25","22:35","22:45","22:55",
      "23:05","23:25","23:55"
    ]
  },
  sab: {
    to_lemos: [
      "01:00","02:40","03:35","04:40",
      "05:00","05:20","05:40",
      "06:00","06:15","06:30","06:45",
      "07:00","07:15","07:30","07:45",
      "08:00","08:15","08:30","08:45",
      "09:00","09:15","09:30","09:45",
      "10:00","10:15","10:30","10:45",
      "11:00","11:15","11:30","11:45",
      "12:00","12:15","12:30","12:45",
      "13:00","13:15","13:30","13:45",
      "14:00","14:15","14:30","14:45",
      "15:00","15:15","15:30","15:45",
      "16:00","16:15","16:30","16:45",
      "17:00","17:15","17:30","17:45",
      "18:00","18:15","18:30","18:45",
      "19:00","19:15","19:30","19:45",
      "20:00","20:15","20:30","20:45",
      "21:00","21:15","21:30","21:45",
      "22:00","22:15","22:30","22:45",
      "23:00","23:10","23:20","23:30","23:40","23:50"
    ],
    to_lacroze: [
      "01:00","02:30","03:45","04:30",
      "05:00","05:30","05:52",
      "06:12","06:32","06:52",
      "07:07","07:22","07:37","07:52",
      "08:07","08:22","08:37","08:52",
      "09:07","09:22","09:37","09:52",
      "10:07","10:22","10:37","10:52",
      "11:07","11:22","11:37","11:52",
      "12:07","12:22","12:37","12:52",
      "13:07","13:22","13:37","13:52",
      "14:07","14:22","14:37","14:52",
      "15:07","15:22","15:37","15:52",
      "16:07","16:22","16:37","16:52",
      "17:07","17:22","17:37","17:52",
      "18:07","18:22","18:37","18:52",
      "19:07","19:22","19:37","19:52",
      "20:07","20:22","20:37","20:52",
      "21:07","21:22","21:37","21:52",
      "22:07","22:22","22:37","22:52",
      "23:03","23:18","23:33","23:48"
    ]
  },
  dom: {
    to_lemos: [
      "01:00","04:25","05:15",
      "06:00","06:30",
      "07:00","07:30",
      "08:00","08:30",
      "09:00","09:30",
      "10:00","10:30",
      "11:00","11:30",
      "12:00","12:30",
      "13:00","13:30",
      "14:00","14:30",
      "15:00","15:30",
      "16:00","16:30",
      "17:00","17:30",
      "18:00","18:30",
      "19:00","19:30",
      "20:00","20:30",
      "21:00","21:30",
      "22:00","22:40",
      "23:50"
    ],
    to_lacroze: [
      "00:01","03:12","04:15","05:30",
      "06:20","06:55",
      "07:25","07:55",
      "08:25","08:55",
      "09:25","09:55",
      "10:25","10:55",
      "11:25","11:55",
      "12:25","12:55",
      "13:25","13:55",
      "14:25","14:55",
      "15:25","15:55",
      "16:25","16:55",
      "17:25","17:55",
      "18:25","18:55",
      "19:25","19:55",
      "20:25","20:55",
      "21:25","21:55",
      "22:25","22:55",
      "23:35"
    ]
  }
};

function getDayType(date) {
  const dow = date.getDay(); // 0=dom, 6=sab
  if (dow === 0) return "dom";
  if (dow === 6) return "sab";
  return "lav";
}

function timeToMins(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function getNextTrains(originKey, destKey, baseDate, delayMinutes) {
  const dayType  = getDayType(baseDate);
  const oIdx     = LINE_ORDER.indexOf(originKey);
  const dIdx     = LINE_ORDER.indexOf(destKey);
  const direction = dIdx > oIdx ? "to_lemos" : "to_lacroze";

  // Horarios base desde el extremo de la línea
  const baseTimes = SCHEDULES[dayType][direction];

  // Tiempo acumulado desde el extremo hasta el origen
  const terminus    = direction === "to_lemos" ? "lacroze" : "lemos";
  const terminusIdx = LINE_ORDER.indexOf(terminus);
  let timeToOrigin  = 0;
  const idxMin = Math.min(terminusIdx, oIdx);
  const idxMax = Math.max(terminusIdx, oIdx);
  for (let i = idxMin; i < idxMax; i++) {
    const seg = `${LINE_ORDER[i]}_${LINE_ORDER[i+1]}`;
    timeToOrigin += SEGMENT_TIMES[seg] || 2;
  }

  // Tiempo desde origen hasta destino
  const tripMins = travelTime(originKey, destKey);

  // Hora base en minutos
  const baseMins = timeToMins(
    `${String(baseDate.getHours()).padStart(2,"0")}:${String(baseDate.getMinutes()).padStart(2,"0")}`
  );

  // Encontrar próximos 3 trenes que pasen por el origen después de baseDate
  const results = [];
  for (const dep of baseTimes) {
    const depAtTerminus = timeToMins(dep) + delayMinutes;
    const depAtOrigin   = depAtTerminus + timeToOrigin;
    if (depAtOrigin >= baseMins && results.length < 3) {
      const depAtOriginStr = `${String(Math.floor(depAtOrigin / 60) % 24).padStart(2,"0")}:${String(depAtOrigin % 60).padStart(2,"0")}`;
      const arrAtDest = depAtOrigin + (tripMins || 0);
      const arrAtDestStr = `${String(Math.floor(arrAtDest / 60) % 24).padStart(2,"0")}:${String(arrAtDest % 60).padStart(2,"0")}`;
      const waitMins = depAtOrigin - baseMins;
      results.push({
        direction:    direction === "to_lemos" ? `→ ${STATION_NAMES["lemos"]}` : `→ ${STATION_NAMES["lacroze"]}`,
        departureStr: depAtOriginStr,
        arrivalStr:   arrAtDestStr,
        waitMins,
        platform:     getPlatform(originKey, direction === "to_lemos" ? "asc" : "desc"),
        dayType,
      });
    }
    if (results.length >= 3) break;
  }

  return results;
}

function renderNextTrains(originKey, destKey, baseDate) {
  if (!originKey || !destKey) return;

  const scenario = SCENARIOS[scenarioSelect.value] ?? SCENARIOS.normal;

  // Si la consulta es para un momento futuro (no hoy), ignoramos demoras e interrupciones
  const now       = new Date();
  const isToday   = baseDate.toDateString() === now.toDateString();
  const isFuture  = !isToday || baseDate > now;
  const applyIncident = isToday && (baseDate - now) < 60 * 60 * 1000; // solo si es hoy y dentro de 1 hora

  const delayMinutes = applyIncident ? scenario.delayMinutes : 0;
  const cancelled    = applyIncident ? scenario.cancelled    : false;

  if (trainsFromLabel) {
    trainsFromLabel.textContent =
      `${STATION_NAMES[originKey]} → ${STATION_NAMES[destKey]} · desde las ${formatTime(baseDate)} (${formatDateShort(baseDate)})`;
  }

  // Alerta solo si aplica al momento consultado
  if (applyIncident && scenario.badgeTone !== "ok") {
    tripAlert.style.display   = "flex";
    tripAlertText.textContent = scenario.info;
    tripAlert.className       = `trip-alert alert-${scenario.badgeTone}`;
  } else {
    tripAlert.style.display = "none";
  }

  if (cancelled) {
    nextTrainsBox.style.display = "block";
    tripEmpty.style.display     = "none";
    nextTrainsList.innerHTML    = `
      <div class="train-cancelled">
        <p class="train-cancelled-title">Servicio Interrumpido</p>
        <p class="train-cancelled-sub">No hay trenes disponibles en este momento. Nuestros colaboradores se encuentran trabajando para restablecer el servicio.</p>
        <p class="train-cancelled-eta">⏱ ${scenario.eta}</p>
        <p class="train-cancelled-update">Última actualización: ${nowPretty()}</p>
      </div>`;
    if (trainsUpdated) trainsUpdated.textContent = "";
    return;
  }

  const trains = getNextTrains(originKey, destKey, baseDate, delayMinutes);

  if (!trains.length) {
    nextTrainsBox.style.display = "block";
    tripEmpty.style.display     = "none";
    nextTrainsList.innerHTML    = `
      <div class="train-cancelled">
        <p>🚫 Sin servicios disponibles</p>
        <p class="train-cancelled-sub">No hay más trenes para este día en el horario seleccionado.</p>
      </div>`;
    if (trainsUpdated) trainsUpdated.textContent = "";
    return;
  }
  nextTrainsBox.style.display = "block";
  tripEmpty.style.display     = "none";

  const nowRef     = new Date();
  const isToday2   = baseDate.toDateString() === nowRef.toDateString();
  const isNearNow  = isToday2 && (baseDate - nowRef) < 60 * 60 * 1000;

  function getBadge(idx) {
    if (isNearNow && idx === 0) return `<span class="train-badge-next">PRÓXIMO</span>`;
    return "";
  }

  const ETA_COLORS = ["#4ade80", "#fbbf24", "#fb923c"];

  nextTrainsList.innerHTML = trains.map((t, idx) => {
    const isFirst   = idx === 0;
    const etaColor  = ETA_COLORS[idx] ?? "rgba(255,255,255,0.5)";
    const delayNote = delayMinutes > 0
      ? `<span class="train-delay-note">+${delayMinutes} min por demoras</span>` : "";
    // Solo mostrar "en X min" si es hoy y cerca
    const etaLine = isNearNow
      ? `<p class="train-eta" style="color:${etaColor}">${minutesLabel(t.waitMins)}</p>`
      : "";
    return `
      <div class="train-card">
        <div class="train-left">
          ${getBadge(idx)}
          <p class="train-direction">${t.direction}</p>
          <p class="train-platform">${t.platform} ${delayNote}</p>
        </div>
        <div class="train-right">
          <p class="train-time">${t.departureStr}</p>
          ${etaLine}
          <p class="train-arrival"><span class="train-arrival-icon">Llegada</span> <strong>${t.arrivalStr}</strong></p>
        </div>
      </div>`;
  }).join("");

  if (trainsUpdated) {
    trainsUpdated.textContent = `Actualizado: ${nowPretty()} · Datos orientativos (demo)`;
  }
}

// Inicializar fecha/hora con ahora
function initDateTimeDefaults() {
  if (!tripDate || !tripTime) return;
  const now = new Date();
  tripDate.value = now.toISOString().split("T")[0];
  tripTime.value = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
}

// Botón buscar trenes
if (searchTrainsBtn) {
  searchTrainsBtn.addEventListener("click", () => {
    const origin  = originSelect?.value;
    const dest    = destinationSelect?.value;
    const dateVal = tripDate?.value;
    const timeVal = tripTime?.value;

    if (!origin)          { alert("Elegí la estación de origen.");  return; }
    if (!dest)            { alert("Elegí la estación de destino."); return; }
    if (origin === dest)  { alert("Origen y destino deben ser distintos."); return; }
    if (!dateVal || !timeVal) { alert("Elegí fecha y hora de salida."); return; }

    const baseDate = new Date(`${dateVal}T${timeVal}:00`);
    tripEmpty.style.display = "none";
    renderNextTrains(origin, dest, baseDate);
  });
}


// =============================================
// NAVEGACIÓN ENTRE PANTALLAS
// =============================================

function goTo(screen) {
  [homeScreen, tripScreen, accessScreen, claimScreen].forEach(s => {
    if (s) s.classList.remove("active");
  });
  const map = { home: homeScreen, trip: tripScreen, access: accessScreen, claim: claimScreen };
  if (map[screen]) map[screen].classList.add("active");
  window.scrollTo(0, 0);
}

if (ctaTrip)   ctaTrip.addEventListener("click", () => { goTo("trip"); initDateTimeDefaults(); });
if (backHomeBtn) backHomeBtn.addEventListener("click", () => goTo("home"));

if (ctaAccess) {
  ctaAccess.addEventListener("click", () => {
    goTo("access");
    renderStations("all");
  });
}
if (backHomeFromAccessBtn) backHomeFromAccessBtn.addEventListener("click", () => goTo("home"));

if (ctaClaimBtn) {
  ctaClaimBtn.addEventListener("click", () => {
    goTo("claim");
    if (claimModal) claimModal.style.display = "none";
    renderClaimHistory(JSON.parse(localStorage.getItem("cau_claims") || "[]"));
  });
}
if (backHomeFromClaimBtn) backHomeFromClaimBtn.addEventListener("click", () => goTo("home"));


// =============================================
// ACCESIBILIDAD — DATA MOCK
// =============================================

const STATIONS = [
  { name: "Gral. Lemos",          ramp: true,  rampNote: "",               elevator: false, bathroom: true  },
  { name: "Sargento Cabral",       ramp: false, rampNote: "",               elevator: false, bathroom: true  },
  { name: "Campo de Mayo",         ramp: false, rampNote: "",               elevator: true,  bathroom: true  },
  { name: "Teniente Agneta",       ramp: false, rampNote: "",               elevator: false, bathroom: true  },
  { name: "Capitán Lozano",        ramp: false, rampNote: "",               elevator: true,  bathroom: true  },
  { name: "Sargento Barrufaldi",   ramp: false, rampNote: "",               elevator: true,  bathroom: true  },
  { name: "Juan B. de La Salle",   ramp: true,  rampNote: "",               elevator: true,  bathroom: true  },
  { name: "Ejército de los Andes", ramp: true,  rampNote: "",               elevator: false, bathroom: true  },
  { name: "Rubén Darío",           ramp: true,  rampNote: "",               elevator: true,  bathroom: true  },
  { name: "Jorge Newbery",         ramp: true,  rampNote: "",               elevator: false, bathroom: true  },
  { name: "Pablo Podestá",         ramp: false, rampNote: "",               elevator: true,  bathroom: true  },
  { name: "Martín Coronado",       ramp: true,  rampNote: "",               elevator: true,  bathroom: true  },
  { name: "José M. Bosch",         ramp: true,  rampNote: "",               elevator: false, bathroom: true  },
  { name: "Tropezón",              ramp: true,  rampNote: "",               elevator: false, bathroom: true  },
  { name: "Lourdes",               ramp: true,  rampNote: "",               elevator: false, bathroom: true  },
  { name: "Fernández Moreno",      ramp: true,  rampNote: "",               elevator: false, bathroom: true  },
  { name: "Cnel. Fco. Lynch",      ramp: true,  rampNote: "",               elevator: false, bathroom: true  },
  { name: "Antonio Devoto",        ramp: true,  rampNote: "",               elevator: true,  bathroom: true  },
  { name: "El Libertador",         ramp: true,  rampNote: "solo a Lemos",   elevator: false, bathroom: true  },
  { name: "Dr. Francisco Beiró",   ramp: true,  rampNote: "",               elevator: false, bathroom: true  },
  { name: "Pedro N. Arata",        ramp: true,  rampNote: "solo a Lemos",   elevator: true,  elevatorNote: "solo a Lacroze", bathroom: true },
  { name: "José Artigas",          ramp: false, rampNote: "",               elevator: false, bathroom: true  },
  { name: "Federico Lacroze",      ramp: true,  rampNote: "",               elevator: true,  bathroom: true  },
];

function isAccessible(st) { return st.ramp || st.elevator; }

function pill(label, ok, note) {
  const noteHtml = note ? ` <span class="pill-note">(${note})</span>` : "";
  return `<span class="pill ${ok ? "ok" : "bad"}">${label}: ${ok ? "Sí" : "No"}${noteHtml}</span>`;
}

function matchesFilter(st, filter) {
  if (filter === "all")      return true;
  if (filter === "elevator") return st.elevator;
  if (filter === "ramp")     return st.ramp;
  return true;
}

function renderStations(filter = "all") {
  if (!stationsList) return;
  const items = STATIONS
    .filter(st => matchesFilter(st, filter))
    .map(st => `
      <div class="station-card">
        <h3 class="station-name">${st.name}</h3>
        <div class="pills">
          ${pill("Rampa", st.ramp, st.rampNote)}
          ${pill("Ascensor", st.elevator, st.elevatorNote)}
          ${pill("Baño", st.bathroom)}
        </div>
      </div>
    `)
    .join("");
  stationsList.innerHTML = items || `<div class="station-card">No hay estaciones para este filtro.</div>`;
}

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    renderStations(chip.dataset.filter);
  });
});


// =============================================
// RECLAMOS
// =============================================

function makeClaimId() {
  return `QF-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

async function saveClaim(claim) {
  // Guardar en Supabase
  try {
    await supabaseInsert("reclamos", {
      codigo:   claim.id,
      tipo:     claim.type,
      tramite:  claim.tramite,
      lugar:    claim.lugar,
      estacion: claim.station || null,
      fecha:    claim.date,
      hora:     claim.time,
      detalle:  claim.detail,
      nombre:   claim.name,
      email:    claim.email,
    });
  } catch (err) {
    console.warn("Error guardando en Supabase, usando localStorage:", err);
    // Fallback a localStorage
    const key     = "cau_claims";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.unshift(claim);
    localStorage.setItem(key, JSON.stringify(current));
  }
  // También guardamos en localStorage como backup
  const key     = "cau_claims";
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  current.unshift(claim);
  localStorage.setItem(key, JSON.stringify(current));
}

async function loadClaims(email) {
  try {
    // Traer reclamos del usuario por email desde Supabase
    const data = await supabaseSelect("reclamos", `email=eq.${encodeURIComponent(email)}`);
    return data.map(r => ({
      id:        r.codigo,
      type:      r.tipo,
      tramite:   r.tramite,
      lugar:     r.lugar,
      station:   r.estacion,
      date:      r.fecha,
      time:      r.hora,
      detail:    r.detalle,
      name:      r.nombre,
      email:     r.email,
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.warn("Error cargando desde Supabase, usando localStorage:", err);
    return JSON.parse(localStorage.getItem("cau_claims") || "[]");
  }
}

const TRAMITE_LABELS = {
  vandalismo: "Vandalismo",
  limpieza:   "Limpieza",
  disputa:    "Disputa con el personal",
  sugerencia: "Sugerencia",
};

const LUGAR_LABELS = {
  estacion:  "Estación",
  formacion: "Formación (tren)",
  otros:     "Otros",
};

const STATION_LABELS = {
  lacroze:"Federico Lacroze", artigas:"José Artigas", arata:"Pedro N. Arata",
  "beiró":"Dr. Francisco Beiró", libertador:"El Libertador", devoto:"Antonio Devoto",
  lynch:"Cnel. Fco. Lynch", fernandez_moreno:"Fernández Moreno", lourdes:"Lourdes",
  trapezon:"Tropezón", bosch:"José M. Bosch", coronado:"Martín Coronado",
  podesta:"Pablo Podestá", newbery:"Jorge Newbery", ruben_dario:"Rubén Darío",
  ejercito:"Ejército de los Andes", lasalle:"Juan B. de La Salle",
  barrufaldi:"Sargento Barrufaldi", lozano:"Capitán Lozano", agneta:"Teniente Agneta",
  campo_mayo:"Campo de Mayo", cabral:"Sargento Cabral", lemos:"Gral. Lemos",
};

function formatDate(iso) {
  const d   = new Date(iso);
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const hh  = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}`;
}

function renderClaimHistory(claims) {
  const historyBox = document.getElementById("claimHistory");
  if (!historyBox) return;
  if (!claims || claims.length === 0) {
    historyBox.innerHTML = `<p class="history-empty">Todavía no enviaste gestiones.</p>`;
    return;
  }
  historyBox.innerHTML = claims.map(c => `
    <div class="history-item">
      <div class="history-top">
        <span class="history-type">${TRAMITE_LABELS[c.tramite] ?? c.tramite}</span>
        <span class="history-date">${formatDate(c.createdAt)}</span>
      </div>
      <p class="history-station">📍 ${LUGAR_LABELS[c.lugar] ?? c.lugar}${c.station ? " · " + (STATION_LABELS[c.station] ?? c.station) : ""}</p>
      <p class="history-detail">${c.detail}</p>
      <p class="history-code">${c.id}</p>
    </div>
  `).join("");
}

async function loadAndRenderHistory(email) {
  const historyBox = document.getElementById("claimHistory");
  if (historyBox) historyBox.innerHTML = `<p class="history-empty">Cargando...</p>`;
  const claims = await loadClaims(email);
  renderClaimHistory(claims);
}

// =============================================
// CUSTOM SELECTS — Pantalla Reclamos
// =============================================

const claimStationBox = document.getElementById("claimStationBox");

const TRAMITE_OPTIONS = {
  queja: [
    { value: "vandalismo", label: "Vandalismo" },
    { value: "limpieza",   label: "Limpieza" },
    { value: "disputa",    label: "Disputa con el personal" },
  ],
  sugerencia: [
    { value: "sugerencia", label: "Sugerencia" },
  ]
};

const LUGAR_OPTIONS = [
  { value: "estacion",  label: "Estación" },
  { value: "formacion", label: "Formación (tren)" },
  { value: "otros",     label: "Otros" },
];

function buildSimpleCustomSelect(wrapperId, dropdownId, triggerId, valueId, hiddenId, getOptions, placeholder, onChange) {
  const wrapper  = document.getElementById(wrapperId);
  const dropdown = document.getElementById(dropdownId);
  const trigger  = document.getElementById(triggerId);
  const valueEl  = document.getElementById(valueId);
  const hidden   = document.getElementById(hiddenId);
  if (!wrapper) return;

  function renderOptions() {
    const opts = typeof getOptions === "function" ? getOptions() : getOptions;
    dropdown.innerHTML = opts.map(opt => {
      const isSelected = hidden.value === opt.value;
      return `<div class="cs-option${isSelected ? " selected" : ""}" data-value="${opt.value}">${opt.label}</div>`;
    }).join("");
    dropdown.querySelectorAll(".cs-option").forEach(o => {
      o.addEventListener("click", () => {
        hidden.value = o.dataset.value;
        valueEl.textContent = o.textContent;
        valueEl.classList.remove("placeholder");
        wrapper.classList.remove("open");
        if (onChange) onChange(o.dataset.value);
      });
    });
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = wrapper.classList.contains("open");
    document.querySelectorAll(".custom-select.open").forEach(el => el.classList.remove("open"));
    if (!isOpen) { renderOptions(); wrapper.classList.add("open"); }
  });

  wrapper._reset = () => {
    hidden.value = "";
    valueEl.textContent = placeholder;
    valueEl.classList.add("placeholder");
    wrapper.classList.remove("open");
  };
}

// Tramite — options depend on queja/sugerencia
buildSimpleCustomSelect(
  "claimTramiteWrapper","claimTramiteDropdown","claimTramiteTrigger","claimTramiteValue","claimTramite",
  () => {
    const type = document.getElementById("claimType")?.value || "queja";
    return TRAMITE_OPTIONS[type] || TRAMITE_OPTIONS.queja;
  },
  "Seleccioná una opción"
);

// Lugar — shows/hides station selector
buildSimpleCustomSelect(
  "claimLugarWrapper","claimLugarDropdown","claimLugarTrigger","claimLugarValue","claimLugar",
  LUGAR_OPTIONS,
  "Seleccioná una opción",
  (val) => {
    if (claimStationBox) {
      claimStationBox.style.display = val === "estacion" ? "grid" : "none";
      if (val !== "estacion") {
        const h = document.getElementById("claimStation");
        const v = document.getElementById("claimStationValue");
        if (h) h.value = "";
        if (v) { v.textContent = "Seleccionar estación"; v.classList.add("placeholder"); }
      }
    }
  }
);

// Estacion
buildSimpleCustomSelect(
  "claimStationWrapper","claimStationDropdown","claimStationTrigger","claimStationValue","claimStation",
  STATION_LIST,
  "Seleccionar estación"
);

// También resetear tramite cuando cambia el tipo queja/sugerencia
const toggleBtns   = document.querySelectorAll(".toggle-btn");
const claimTypeInput = document.getElementById("claimType");
const claimTramite   = document.getElementById("claimTramite");

toggleBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    toggleBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const type = btn.dataset.type;
    if (claimTypeInput) claimTypeInput.value = type;
    // Reset tramite when switching type
    const tw = document.getElementById("claimTramiteWrapper");
    if (tw?._reset) tw._reset();
  });
});

// Contador de caracteres en detalle
const claimDetailEl = document.getElementById("claimDetail");
const charCount     = document.getElementById("charCount");
if (claimDetailEl) {
  claimDetailEl.addEventListener("input", () => {
    const len = claimDetailEl.value.trim().length;
    if (charCount) {
      charCount.textContent = `${len}/30 mín.`;
      charCount.style.color = len >= 30 ? "#4ade80" : "rgba(255,255,255,0.4)";
    }
  });
}

// Validación email en tiempo real
const claimEmailEl = document.getElementById("claimEmail");
const emailError   = document.getElementById("emailError");
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
if (claimEmailEl) {
  claimEmailEl.addEventListener("blur", () => {
    const val = claimEmailEl.value.trim();
    if (val && !isValidEmail(val)) {
      if (emailError) emailError.style.display = "block";
      claimEmailEl.style.borderColor = "rgba(220,38,38,0.6)";
    } else {
      if (emailError) emailError.style.display = "none";
      claimEmailEl.style.borderColor = "";
    }
  });
}

// Fotos — máximo 3
const claimPhotos  = document.getElementById("claimPhotos");
const photoPreview = document.getElementById("photoPreview");
if (claimPhotos) {
  claimPhotos.addEventListener("change", () => {
    const files = Array.from(claimPhotos.files).slice(0, 3);
    if (claimPhotos.files.length > 3) alert("Podés adjuntar hasta 3 fotos.");
    if (photoPreview) {
      photoPreview.innerHTML = files.map(f =>
        `<span class="photo-chip">📷 ${f.name}</span>`
      ).join("");
    }
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    claimPhotos.files = dt.files;
    const label = document.getElementById("fileUploadText");
    if (label) label.textContent = files.length > 0
      ? `${files.length} foto${files.length > 1 ? "s" : ""} seleccionada${files.length > 1 ? "s" : ""}`
      : "Tocá para adjuntar fotos";
  });
}

// Modal confirmación
const claimModal      = document.getElementById("claimModal");
const claimModalClose = document.getElementById("claimModalClose");
const claimModalCode  = document.getElementById("claimModalCode");

function closeClaimModal() {
  if (claimModal) { claimModal.style.display = "none"; document.body.style.overflow = ""; }
}
if (claimModalClose) claimModalClose.addEventListener("click", closeClaimModal);
if (claimModal) claimModal.addEventListener("click", e => { if (e.target === claimModal) closeClaimModal(); });

// Enviar
const sendClaimBtn = document.getElementById("sendClaimBtn");
if (sendClaimBtn) {
  sendClaimBtn.addEventListener("click", async () => {
    const type    = claimTypeInput?.value;
    const tramite = claimTramite?.value;
    const lugar   = claimLugar?.value;
    const station = document.getElementById("claimStation")?.value;
    const date    = document.getElementById("claimDate")?.value;
    const time    = document.getElementById("claimTime")?.value;
    const detail  = claimDetailEl?.value.trim();
    const name    = document.getElementById("claimName")?.value.trim();
    const email   = claimEmailEl?.value.trim();

    if (!tramite)              { alert("Seleccioná el motivo."); return; }
    if (!lugar)                { alert("Seleccioná el lugar."); return; }
    if (lugar === "estacion" && !station) { alert("Seleccioná la estación."); return; }
    if (!date)                 { alert("Ingresá la fecha."); return; }
    if (!time)                 { alert("Ingresá la hora."); return; }
    if (!detail || detail.length < 30) { alert("El detalle debe tener al menos 30 caracteres."); return; }
    if (!name)                 { alert("Ingresá tu nombre y apellido."); return; }
    if (!email)                { alert("Ingresá tu e-mail."); return; }
    if (!isValidEmail(email))  { alert("El e-mail no tiene un formato válido. Usá dirección@email.com"); return; }

    sendClaimBtn.disabled    = true;
    sendClaimBtn.textContent = "Enviando...";

    const claim = {
      id: makeClaimId(),
      type, tramite, lugar,
      station: lugar === "estacion" ? station : null,
      date, time, detail, name, email,
      createdAt: new Date().toISOString(),
    };

    await saveClaim(claim);

    sendClaimBtn.disabled    = false;
    sendClaimBtn.textContent = "Enviar tu queja o sugerencia";

    if (claimModalCode) claimModalCode.textContent = claim.id;
    if (claimModal) { claimModal.style.display = "flex"; document.body.style.overflow = "hidden"; }

    // Limpiar
    document.getElementById("claimTramiteWrapper")?._reset();
    document.getElementById("claimLugarWrapper")?._reset();
    document.getElementById("claimStationWrapper")?._reset();
    if (document.getElementById("claimStation")) document.getElementById("claimStation").value = "";
    const csVal = document.getElementById("claimStationValue");
    if (csVal) { csVal.textContent = "Seleccionar estación"; csVal.classList.add("placeholder"); }
    if (claimStationBox) claimStationBox.style.display = "none";
    if (document.getElementById("claimDate")) document.getElementById("claimDate").value = "";
    if (document.getElementById("claimTime")) document.getElementById("claimTime").value = "";
    if (claimDetailEl) claimDetailEl.value = "";
    if (document.getElementById("claimName")) document.getElementById("claimName").value = "";
    if (claimEmailEl)  claimEmailEl.value  = "";
    if (photoPreview)  photoPreview.innerHTML = "";
    if (charCount)     charCount.textContent = "0/30 mín.";

    loadAndRenderHistory(email);
  });
}

function saveClaim(claim) {
  const key     = "cau_claims";
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  current.unshift(claim);
  localStorage.setItem(key, JSON.stringify(current));
}

function loadClaims() {
  return JSON.parse(localStorage.getItem("cau_claims") || "[]");
}

// =============================================
// PWA — SERVICE WORKER
// =============================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (err) {
      console.warn("Service Worker no se pudo registrar:", err);
    }
  });
}
