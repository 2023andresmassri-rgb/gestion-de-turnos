// Base de datos local (Persistencia en LocalStorage)
let turnos = JSON.parse(localStorage.getItem('turnos_app')) || [];

// Referencias a Elementos DOM
const formOS = document.getElementById('form-obra-social');
const formMed = document.getElementById('form-medico');

const osFechaInput = document.getElementById('os-fecha');
const osHoraSelect = document.getElementById('os-hora');
const medFechaInput = document.getElementById('med-fecha');
const medHoraSelect = document.getElementById('med-hora');

const listaOS = document.getElementById('lista-os');
const listaMed = document.getElementById('lista-med');
const cantOS = document.getElementById('cant-os');
const cantMed = document.getElementById('cant-med');

const modalError = document.getElementById('modal-error');
const mensajeError = document.getElementById('mensaje-error');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');

// --- RESTRICCIÓN 1: No permitir fechas anteriores al día actual ---
function obtenerFechaHoy() {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function configurarMinFechas() {
    const hoy = obtenerFechaHoy();
    osFechaInput.min = hoy;
    medFechaInput.min = hoy;
}

// --- RESTRICCIÓN 2: Generar intervalos de 30 minutos ---
function generarHorarios() {
    const horarios = [];
    // Horario de atención estándar: 08:00 a 20:00
    for (let h = 8; h < 20; h++) {
        for (let m of ['00', '30']) {
            const horaFormateada = `${String(h).padStart(2, '0')}:${m}`;
            horarios.push(horaFormateada);
        }
    }

    [osHoraSelect, medHoraSelect].forEach(select => {
        select.innerHTML = '<option value="">Seleccionar...</option>';
        horarios.forEach(hora => {
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = `${hora} hs`;
            select.appendChild(option);
        });
    });
}

// --- RESTRICCIÓN 3: Validar solapamiento entre Obra Social y Médicos ---
function existeSolapamiento(fecha, hora) {
    return turnos.find(t => t.fecha === fecha && t.hora === hora);
}

// Mostrar Alertas
function mostrarError(mensaje) {
    mensajeError.innerHTML = mensaje;
    modalError.classList.remove('hidden');
}

btnCerrarModal.addEventListener('click', () => {
    modalError.classList.add('hidden');
});

// Guardar en LocalStorage
function guardarEnLocalStorage() {
    localStorage.setItem('turnos_app', JSON.stringify(turnos));
}

// Renderizado de Turnos en pantalla
function renderizarTurnos() {
    listaOS.innerHTML = '';
    listaMed.innerHTML = '';

    // Filtrar por tipo
    const turnosOS = turnos.filter(t => t.tipo === 'obra-social');
    const turnosMed = turnos.filter(t => t.tipo === 'medico');

    cantOS.textContent = turnosOS.length;
    cantMed.textContent = turnosMed.length;

    // Render Turnos Obra Social
    if (turnosOS.length === 0) {
        listaOS.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">No hay turnos registrados</p>`;
    } else {
        turnosOS.forEach(t => {
            listaOS.appendChild(crearCardTurno(t));
        });
    }

    // Render Turnos Médicos
    if (turnosMed.length === 0) {
        listaMed.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">No hay turnos registrados</p>`;
    } else {
        turnosMed.forEach(t => {
            listaMed.appendChild(crearCardTurno(t));
        });
    }
}

// Construcción del HTML de cada tarjeta de turno
function crearCardTurno(turno) {
    const card = document.createElement('div');
    const esOS = turno.tipo === 'obra-social';
    
    card.className = `turno-card p-3 rounded-xl border ${esOS ? 'bg-cyan-50/60 border-cyan-200' : 'bg-emerald-50/60 border-emerald-200'} flex justify-between items-center transition-all hover:shadow-sm`;

    const titulo = esOS ? turno.entidad : turno.especialidad;
    const subtitulo = esOS ? turno.tramite : turno.doctor;
    const badgeColor = esOS ? 'bg-cyan-600 text-white' : 'bg-emerald-600 text-white';

    // Formatear Fecha visualmente
    const [year, month, day] = turno.fecha.split('-');
    const fechaFormateada = `${day}/${month}/${year}`;

    card.innerHTML = `
        <div class="space-y-1">
            <div class="flex items-center gap-2">
                <span class="text-xs font-bold px-2 py-0.5 rounded ${badgeColor}">
                    <i class="fa-regular fa-clock mr-1"></i>${turno.hora} hs
                </span>
                <span class="text-xs font-semibold text-slate-600">
                    <i class="fa-regular fa-calendar mr-1"></i>${fechaFormateada}
                </span>
            </div>
            <h4 class="font-bold text-sm text-slate-800 leading-tight">${titulo}</h4>
            <p class="text-xs text-slate-500">${subtitulo}</p>
        </div>
        <button onclick="eliminarTurno('${turno.id}')" class="text-slate-400 hover:text-rose-500 p-2 transition-colors rounded-lg hover:bg-rose-50" title="Eliminar Turno">
            <i class="fa-solid fa-trash-can"></i>
        </button>
    `;

    return card;
}

// Handler para Eliminar Turno
window.eliminarTurno = function(id) {
    turnos = turnos.filter(t => t.id !== id);
    guardarEnLocalStorage();
    renderizarTurnos();
};

// Handlers para los Formularios
formOS.addEventListener('submit', (e) => {
    e.preventDefault();
    const fecha = osFechaInput.value;
    const hora = osHoraSelect.value;
    const entidad = document.getElementById('os-entidad').value;
    const tramite = document.getElementById('os-tramite').value;

    // Validación Restricción 3
    const conflicto = existeSolapamiento(fecha, hora);
    if (conflicto) {
        mostrarError(`El horario <strong>${hora} hs</strong> del día <strong>${fecha}</strong> ya está ocupado por un turno de <span class="font-semibold">${conflicto.tipo === 'obra-social' ? 'Obra Social' : 'Consulta Médica'}</span> (${conflicto.entidad || conflicto.especialidad}).`);
        return;
    }

    const nuevoTurno = {
        id: Date.now().toString(),
        tipo: 'obra-social',
        entidad,
        tramite,
        fecha,
        hora
    };

    turnos.push(nuevoTurno);
    guardarEnLocalStorage();
    renderizarTurnos();
    formOS.reset();
});

formMed.addEventListener('submit', (e) => {
    e.preventDefault();
    const fecha = medFechaInput.value;
    const hora = medHoraSelect.value;
    const especialidad = document.getElementById('med-especialidad').value;
    const doctor = document.getElementById('med-doctor').value;

    // Validación Restricción 3
    const conflicto = existeSolapamiento(fecha, hora);
    if (conflicto) {
        mostrarError(`El horario <strong>${hora} hs</strong> del día <strong>${fecha}</strong> ya está ocupado por un turno de <span class="font-semibold">${conflicto.tipo === 'obra-social' ? 'Obra Social' : 'Consulta Médica'}</span> (${conflicto.entidad || conflicto.especialidad}).`);
        return;
    }

    const nuevoTurno = {
        id: Date.now().toString(),
        tipo: 'medico',
        especialidad,
        doctor,
        fecha,
        hora
    };

    turnos.push(nuevoTurno);
    guardarEnLocalStorage();
    renderizarTurnos();
    formMed.reset();
});

// Inicialización de la aplicación
function init() {
    configurarMinFechas();
    generarHorarios();
    renderizarTurnos();
}

init();
