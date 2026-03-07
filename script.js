// Función para sanitizar HTML y prevenir XSS
// FunciÃ³n para sanitizar HTML y prevenir XSS
function sanitize(str) {
if (str === null || str === undefined) return '';
const div = document.createElement('div');
div.textContent = String(str);
return div.innerHTML;
}

const CONFIG = {
SHEETS_ID: '1D-7MSO6Gcn_gtgqEhOM43lQXOVGDrzlM2ec8hitT5oQ',
BASE_URL: 'https://docs.google.com/spreadsheets/d'
};

function getSheetsURL(sheetName) {
return `${CONFIG.BASE_URL}/${CONFIG.SHEETS_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}&v=${Date.now()}`;
}

let data = { alumnos: [], pagos: [], asistencia: [], egresos: [] };
let dataFiltrada = { alumnos: [], pagos: [], asistencia: [], egresos: [] };
let charts = {};
let filtros = {
fechaInicio: '',
fechaFin: '',
grupo: 'todos',
empresa: 'todos',
status: 'todos',
search: ''
};

document.addEventListener('DOMContentLoaded', function() {
let data = { alumnos: [], pagos: [], asistencia: [], egresos: [] };
let dataFiltrada = { alumnos: [], pagos: [], asistencia: [], egresos: [] };
let charts = {};
let cargaInicial = true;

function initDashboard() {
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-MX', { 
weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
});

inicializarFiltros();
cargarDatos();

document.querySelectorAll('.nav-link').forEach(link => {
link.addEventListener('click', function(e) {
e.preventDefault();
cambiarSeccion(this.dataset.section);
});
});
});
}

document.addEventListener('DOMContentLoaded', initDashboard);

function inicializarFiltros() {
document.getElementById('filterFechaInicio').value = '';
document.getElementById('filterFechaFin').value = '';

['filterFechaInicio', 'filterFechaFin', 'filterGrupo', 'filterEmpresa', 'filterStatus', 'filterSearch'].forEach(id => {
document.getElementById(id).addEventListener('change', aplicarFiltros);
document.getElementById(id).addEventListener('input', aplicarFiltros);
});
}

function cambiarSeccion(seccion) {
document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
document.querySelector(`[data-section="${seccion}"]`).classList.add('active');

document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
document.getElementById(seccion).classList.add('active');
}

async function recargarDatos() {
const btn = document.getElementById('btnActualizar');
if (btn) {
btn.disabled = true;
btn.innerHTML = '<i class="bi bi-arrow-clockwise spinning"></i> Cargando...';
}

    // Reset filtros para mostrar todos los datos
    filtros = {
        fechaInicio: '',
        fechaFin: '',
        grupo: 'todos',
        empresa: 'todos',
        status: 'todos',
        search: ''
    };
    
    // Resetear los selectores de filtros
    document.getElementById('filterFechaInicio').value = '';
    document.getElementById('filterFechaFin').value = '';
    document.getElementById('filterGrupo').value = 'todos';
    document.getElementById('filterEmpresa').value = 'todos';
    document.getElementById('filterStatus').value = 'todos';
    document.getElementById('filterSearch').value = '';
    
await cargarDatos();

if (btn) {
btn.disabled = false;
btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Actualizar';
}
}

async function cargarDatos() {
try {
        mostrarCarga(true);
        
const [alumnosCSV, pagosCSV, asistenciaCSV, egresosCSV] = await Promise.all([
fetchCSV('Alumnos'),
fetchCSV('Pagos'),
fetchCSV('Asistencia'),
fetchCSV('Egresos')
]);

data.alumnos = convertirAlumnos(alumnosCSV);
data.pagos = convertirPagos(pagosCSV);
data.asistencia = convertirAsistencia(asistenciaCSV);
data.egresos = convertirEgresos(egresosCSV);

cargarEmpresasEnFiltro();
        renderizarDashboard();
        aplicarFiltros();
        mostrarCarga(false);

} catch (error) {
console.error('Error:', error);
        mostrarCarga(false);
    }
}

function mostrarCarga(mostrar) {
    const content = document.querySelector('.content-area');
    if (content) {
        if (mostrar) {
            content.style.opacity = '0.5';
        } else {
            content.style.opacity = '1';
        }
}
}

async function fetchCSV(sheetName) {
const url = getSheetsURL(sheetName);
try {
const response = await fetch(url);
if (!response.ok) return '';
return await response.text();
} catch (error) {
console.error('Error fetching:', sheetName, error);
return '';
}
}

function csvToJSON(csv) {
if (!csv || csv.trim() === '') return [];
const lines = csv.trim().split('\n');
if (lines.length < 2) return [];

const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
const result = [];

for (let i = 1; i < lines.length; i++) {
const values = [];
let current = '';
let inQuotes = false;

for (let char of lines[i]) {
if (char === '"') {
inQuotes = !inQuotes;
} else if (char === ',' && !inQuotes) {
values.push(current.trim());
current = '';
} else {
current += char;
}
}
values.push(current.trim());

const obj = {};
headers.forEach((header, index) => {
obj[header] = values[index] || '';
});
result.push(obj);
}
return result;
}

function convertirAlumnos(csv) {
const rows = csvToJSON(csv);
return rows.map((row, index) => ({
id: index + 1,
nombre: row['Nombre'] || row['Nombre '] || '',
fechaNac: row['Fecha Nac.'] || row['Fecha Nac'] || '',
grupo: row['Grupo'] || '',
sexo: row['Sexo'] || '',
fechaIngreso: row['Fecha Ingreso'] || '',
status: row['Status'] || 'Activo',
tutor: row['Tutor'] || '',
        telefono: row['Teléfono'] || row['Telefono'] || '',
        telefono: row['TelÃ©fono'] || row['Telefono'] || '',
empresa: row['Empresa'] || '',
empresaFact: row['Empresa Fact.'] || row['Empresa Fact'] || row['Empresa'] || ''
}));
}

function convertirPagos(csv) {
const rows = csvToJSON(csv);
return rows.map(row => ({
fecha: row['Fecha'] || '',
alumno: row['Alumno'] || '',
mes: row['Mes'] || '',
monto: parseFloat(row['Monto']) || 0,
tipo: row['Tipo'] || '',
referencia: row['Referencia'] || '',
status: row['Status'] || 'Pendiente',
fechaReg: row['Fecha Registro'] || row['Fecha'] || ''
}));
}

function convertirAsistencia(csv) {
const rows = csvToJSON(csv);
return rows.map(row => ({
fecha: row['Fecha'] || '',
alumno: row['Alumno'] || '',
status: row['Status'] || 'Presente',
notas: row['Notas'] || ''
}));
}

function convertirEgresos(csv) {
const rows = csvToJSON(csv);
return rows.map(row => ({
fecha: row['Fecha'] || '',
        descripcion: row['Descripción'] || row['Descripcion'] || '',
        descripcion: row['DescripciÃ³n'] || row['Descripcion'] || '',
monto: parseFloat(row['Monto']) || 0,
        categoria: row['Categoría'] || row['Categoria'] || '',
        categoria: row['CategorÃ­a'] || row['Categoria'] || '',
status: row['Status'] || 'Pagado'
}));
}

function cargarEmpresasEnFiltro() {
const empresas = [...new Set(data.alumnos.map(a => a.empresa).filter(e => e))];
const select = document.getElementById('filterEmpresa');
select.innerHTML = '<option value="todos">Todas</option>';
empresas.forEach(e => {
select.innerHTML += `<option value="${sanitize(e)}">${sanitize(e)}</option>`;
});
}

function aplicarFiltros() {
filtros.fechaInicio = document.getElementById('filterFechaInicio').value;
filtros.fechaFin = document.getElementById('filterFechaFin').value;
filtros.grupo = document.getElementById('filterGrupo').value;
filtros.empresa = document.getElementById('filterEmpresa').value;
filtros.status = document.getElementById('filterStatus').value;
filtros.search = document.getElementById('filterSearch').value.toLowerCase();

dataFiltrada.alumnos = data.alumnos.filter(a => filtrarAlumno(a));
dataFiltrada.pagos = data.pagos.filter(p => filtrarPago(p));
dataFiltrada.asistencia = data.asistencia.filter(a => filtrarAsistencia(a));
dataFiltrada.egresos = data.egresos.filter(e => filtrarEgreso(e));

renderizarDashboard();
}

function filtrarAlumno(a) {
if (filtros.grupo !== 'todos' && a.grupo !== filtros.grupo) return false;
if (filtros.empresa !== 'todos' && a.empresa !== filtros.empresa) return false;
if (filtros.status !== 'todos' && a.status !== filtros.status) return false;
if (filtros.search && !a.nombre.toLowerCase().includes(filtros.search) && 
!a.tutor.toLowerCase().includes(filtros.search)) return false;
return true;
}

function filtrarPago(p) {
if (filtros.fechaInicio && p.fecha < filtros.fechaInicio) return false;
if (filtros.fechaFin && p.fecha > filtros.fechaFin) return false;
if (filtros.status !== 'todos' && p.status !== filtros.status) return false;
if (filtros.search && !p.alumno.toLowerCase().includes(filtros.search)) return false;
return true;
}

function filtrarAsistencia(a) {
if (filtros.fechaInicio && a.fecha < filtros.fechaInicio) return false;
if (filtros.fechaFin && a.fecha > filtros.fechaFin) return false;
if (filtros.status !== 'todos' && a.status !== filtros.status) return false;
if (filtros.search && !a.alumno.toLowerCase().includes(filtros.search)) return false;
return true;
}

function filtrarEgreso(e) {
if (filtros.fechaInicio && e.fecha < filtros.fechaInicio) return false;
if (filtros.fechaFin && e.fecha > filtros.fechaFin) return false;
return true;
}

function renderizarDashboard() {
actualizarResumen();
actualizarAlumnos();
actualizarPagos();
actualizarAsistencia();
actualizarEgresos();
actualizarFinanzas();
actualizarGraficos();
}

function actualizarResumen() {
const activos = dataFiltrada.alumnos.filter(a => a.status === 'Activo').length;
const ingresos = dataFiltrada.pagos.filter(p => p.status === 'Pagado').reduce((s, p) => s + p.monto, 0);
const pendientes = dataFiltrada.pagos.filter(p => p.status === 'Pendiente').reduce((s, p) => s + p.monto, 0);
const asistenciaTotal = dataFiltrada.asistencia.length;
const presente = dataFiltrada.asistencia.filter(a => a.status === 'Presente').length;
const asistenciaPct = asistenciaTotal > 0 ? Math.round((presente / asistenciaTotal) * 100) : 0;
const egresos = dataFiltrada.egresos.reduce((s, e) => s + e.monto, 0);
const balance = ingresos - egresos;
const ausencias = dataFiltrada.asistencia.filter(a => a.status === 'Ausente').length;

const facturacionEmpresa = dataFiltrada.pagos
.filter(p => p.status === 'Pagado')
.reduce((s, p) => {
const alumno = data.alumnos.find(a => a.nombre === p.alumno);
if (alumno && alumno.empresaFact && alumno.empresaFact !== 'Comunidad') {
return s + p.monto;
}
return s;
}, 0);

document.getElementById('kpiAlumnosActivos').textContent = activos;
document.getElementById('kpiIngresos').textContent = formatCurrency(ingresos);
document.getElementById('kpiPendientes').textContent = formatCurrency(pendientes);
document.getElementById('kpiAsistencia').textContent = asistenciaPct + '%';
document.getElementById('kpiEgresos').textContent = formatCurrency(egresos);
document.getElementById('kpiBalance').textContent = formatCurrency(balance);
document.getElementById('kpiFacturacion').textContent = formatCurrency(facturacionEmpresa);
document.getElementById('kpiAusencias').textContent = ausencias;

const ultimosPagos = dataFiltrada.pagos.slice(-5).reverse();
document.querySelector('#tablaUltimosPagos tbody').innerHTML = ultimosPagos.map(p => 
`<tr><td>${sanitize(p.fecha)}</td><td>${sanitize(p.alumno)}</td><td>${formatCurrency(p.monto)}</td><td><span class="badge ${p.status === 'Pagado' ? 'bg-success' : 'bg-warning'}">${sanitize(p.status)}</span></td></tr>`
).join('');

const alertas = [];
if (pendientes > 0) alertas.push(`<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> Pagos pendientes: ${formatCurrency(pendientes)}</div>`);
if (ausencias > 0) alertas.push(`<div class="alert alert-danger"><i class="bi bi-person-dash"></i> Total ausencias: ${ausencias}</div>`);
    if (activos < 5) alertas.push(`<div class="alert alert-info"><i class="bi bi-info-circle"></i> Baja inscripción: ${activos} alumnos activos</div>`);
    if (activos < 5) alertas.push(`<div class="alert alert-info"><i class="bi bi-info-circle"></i> Baja inscripciÃ³n: ${activos} alumnos activos</div>`);
document.getElementById('alertasContent').innerHTML = alertas.length ? alertas.join('') : '<div class="alert alert-success"><i class="bi bi-check-circle"></i> Sin alertas</div>';
}

function actualizarAlumnos() {
document.getElementById('badgeTotalAlumnos').textContent = dataFiltrada.alumnos.length;
document.querySelector('#tablaAlumnos tbody').innerHTML = dataFiltrada.alumnos.map(a => 
`<tr>
           <td>${sanitize(a.id)}</td>
           <td>${sanitize(a.nombre)}</td>
           <td>${sanitize(a.fechaNac)}</td>
           <td><span class="badge bg-primary">${sanitize(a.grupo)}</span></td>
           <td>${sanitize(a.sexo)}</td>
           <td>${sanitize(a.fechaIngreso)}</td>
           <td><span class="badge ${a.status === 'Activo' ? 'bg-success' : 'bg-secondary'}">${sanitize(a.status)}</span></td>
           <td>${sanitize(a.tutor)}</td>
           <td>${sanitize(a.telefono)}</td>
           <td>${sanitize(a.empresa)}</td>
       </tr>`
).join('');
}

function actualizarPagos() {
const total = dataFiltrada.pagos.length;
const pagados = dataFiltrada.pagos.filter(p => p.status === 'Pagado').length;
const pendientes = dataFiltrada.pagos.filter(p => p.status === 'Pendiente').length;
const montoTotal = dataFiltrada.pagos.reduce((s, p) => s + p.monto, 0);

document.getElementById('pagoTotalRegistros').textContent = total;
document.getElementById('pagoTotalPagados').textContent = pagados;
document.getElementById('pagoTotalPendientes').textContent = pendientes;
document.getElementById('pagoMontoTotal').textContent = formatCurrency(montoTotal);

document.querySelector('#tablaPagos tbody').innerHTML = dataFiltrada.pagos.map(p => 
`<tr>
           <td>${sanitize(p.fecha)}</td>
           <td>${sanitize(p.alumno)}</td>
           <td>${sanitize(p.mes)}</td>
           <td>${formatCurrency(p.monto)}</td>
           <td>${sanitize(p.tipo)}</td>
           <td>${sanitize(p.referencia)}</td>
           <td><span class="badge ${p.status === 'Pagado' ? 'bg-success' : 'bg-warning'}">${sanitize(p.status)}</span></td>
       </tr>`
).join('');
}

function actualizarAsistencia() {
const total = dataFiltrada.asistencia.length;
const presentes = dataFiltrada.asistencia.filter(a => a.status === 'Presente').length;
const ausentes = dataFiltrada.asistencia.filter(a => a.status === 'Ausente').length;
const tardes = dataFiltrada.asistencia.filter(a => a.status === 'Tarde').length;

document.getElementById('asisTotal').textContent = total;
document.getElementById('asisPresentes').textContent = presentes;
document.getElementById('asisAusentes').textContent = ausentes;
document.getElementById('asisTardes').textContent = tardes;

const asistenciaConGrupo = dataFiltrada.asistencia.map(a => {
const alumno = data.alumnos.find(al => al.nombre === a.alumno);
return { ...a, grupo: alumno ? alumno.grupo : 'N/A' };
});

document.querySelector('#tablaAsistencia tbody').innerHTML = asistenciaConGrupo.map(a => 
`<tr>
           <td>${sanitize(a.fecha)}</td>
           <td>${sanitize(a.alumno)}</td>
           <td><span class="badge bg-primary">${sanitize(a.grupo)}</span></td>
           <td><span class="badge ${a.status === 'Presente' ? 'bg-success' : a.status === 'Ausente' ? 'bg-danger' : 'bg-warning'}">${sanitize(a.status)}</span></td>
           <td>${sanitize(a.notas)}</td>
       </tr>`
).join('');
}

function actualizarEgresos() {
const total = dataFiltrada.egresos.reduce((s, e) => s + e.monto, 0);
document.getElementById('egresoTotal').textContent = formatCurrency(total);
document.getElementById('egresoNumRegistros').textContent = dataFiltrada.egresos.length;

document.querySelector('#tablaEgresos tbody').innerHTML = dataFiltrada.egresos.map(e => 
`<tr>
           <td>${sanitize(e.fecha)}</td>
           <td>${sanitize(e.descripcion)}</td>
           <td>${formatCurrency(e.monto)}</td>
           <td><span class="badge bg-info">${sanitize(e.categoria)}</span></td>
           <td><span class="badge ${e.status === 'Pagado' ? 'bg-success' : 'bg-warning'}">${sanitize(e.status)}</span></td>
       </tr>`
).join('');
}

function actualizarFinanzas() {
const ingresos = dataFiltrada.pagos.filter(p => p.status === 'Pagado').reduce((s, p) => s + p.monto, 0);
const egresos = dataFiltrada.egresos.reduce((s, e) => s + e.monto, 0);
const balance = ingresos - egresos;

document.getElementById('finIngresos').textContent = formatCurrency(ingresos);
document.getElementById('finEgresos').textContent = formatCurrency(egresos);
document.getElementById('finBalance').textContent = formatCurrency(balance);

const empresas = {};
dataFiltrada.alumnos.filter(a => a.status === 'Activo').forEach(a => {
if (!empresas[a.empresa]) {
empresas[a.empresa] = { nombre: a.empresa, alumnos: 0, ingresos: 0 };
}
empresas[a.empresa].alumnos++;
});

dataFiltrada.pagos.filter(p => p.status === 'Pagado').forEach(p => {
const alumno = data.alumnos.find(a => a.nombre === p.alumno);
if (alumno && empresas[alumno.empresa]) {
empresas[alumno.empresa].ingresos += p.monto;
}
});

const totalIngresos = Object.values(empresas).reduce((s, e) => s + e.ingresos, 0);

document.querySelector('#tablaFinancieroEmpresa tbody').innerHTML = Object.values(empresas).map(e => 
`<tr>
           <td>${sanitize(e.nombre)}</td>
           <td>${e.alumnos}</td>
           <td>${formatCurrency(e.ingresos)}</td>
           <td>${totalIngresos > 0 ? ((e.ingresos / totalIngresos) * 100).toFixed(1) : 0}%</td>
       </tr>`
).join('');
}

function actualizarGraficos() {
const grupos = { 'Peque': 0, 'Intermedio': 0, 'Grande': 0 };
dataFiltrada.alumnos.filter(a => a.status === 'Activo').forEach(a => {
if (grupos[a.grupo] !== undefined) grupos[a.grupo]++;
});
crearGrafico('chartGrupo', 'pie', {
labels: Object.keys(grupos),
datasets: [{ data: Object.values(grupos), backgroundColor: ['#4a90d9', '#28a745', '#ffc107'] }]
});

const ingresosPorEmpresa = {};
dataFiltrada.pagos.filter(p => p.status === 'Pagado').forEach(p => {
const alumno = data.alumnos.find(a => a.nombre === p.alumno);
const empresa = alumno ? alumno.empresa : 'Otro';
ingresosPorEmpresa[empresa] = (ingresosPorEmpresa[empresa] || 0) + p.monto;
});
crearGrafico('chartEmpresa', 'pie', {
labels: Object.keys(ingresosPorEmpresa),
datasets: [{ data: Object.values(ingresosPorEmpresa), backgroundColor: ['#4a90d9', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'] }]
});

const asisPorDia = {};
dataFiltrada.asistencia.forEach(a => {
asisPorDia[a.fecha] = asisPorDia[a.fecha] || { presente: 0, ausente: 0, tarde: 0 };
if (a.status === 'Presente') asisPorDia[a.fecha].presente++;
else if (a.status === 'Ausente') asisPorDia[a.fecha].ausente++;
else if (a.status === 'Tarde') asisPorDia[a.fecha].tarde++;
});
const fechas = Object.keys(asisPorDia).slice(-10);
crearGrafico('chartAsistencia', 'bar', {
labels: fechas.map(f => f.substring(5)),
datasets: [
{ label: 'Presentes', data: fechas.map(f => asisPorDia[f].presente), backgroundColor: '#28a745' },
{ label: 'Tardes', data: fechas.map(f => asisPorDia[f].tarde), backgroundColor: '#ffc107' },
{ label: 'Ausentes', data: fechas.map(f => asisPorDia[f].ausente), backgroundColor: '#dc3545' }
]
});

const egresosCat = {};
dataFiltrada.egresos.forEach(e => {
egresosCat[e.categoria] = (egresosCat[e.categoria] || 0) + e.monto;
});
crearGrafico('chartEgresos', 'doughnut', {
labels: Object.keys(egresosCat),
datasets: [{ data: Object.values(egresosCat), backgroundColor: ['#dc3545', '#ffc107', '#28a745', '#17a2b8', '#6f42c1'] }]
});

const pagosPorMes = {};
dataFiltrada.pagos.filter(p => p.status === 'Pagado').forEach(p => {
const mes = p.mes;
pagosPorMes[mes] = (pagosPorMes[mes] || 0) + p.monto;
});
crearGrafico('chartPagosMes', 'bar', {
labels: Object.keys(pagosPorMes),
datasets: [{ label: 'Ingresos', data: Object.values(pagosPorMes), backgroundColor: '#28a745' }]
});

const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dec'];
const ingresosMensuales = new Array(12).fill(0);
const egresosMensuales = new Array(12).fill(0);
dataFiltrada.pagos.filter(p => p.status === 'Pagado').forEach(p => {
const mes = parseInt(p.fecha.split('-')[1]) - 1;
if (mes >= 0) ingresosMensuales[mes] += p.monto;
});
dataFiltrada.egresos.forEach(e => {
const mes = parseInt(e.fecha.split('-')[1]) - 1;
if (mes >= 0) egresosMensuales[mes] += e.monto;
});
crearGrafico('chartFinanciero', 'line', {
labels: meses,
datasets: [
{ label: 'Ingresos', data: ingresosMensuales, borderColor: '#28a745', backgroundColor: 'rgba(40, 167, 69, 0.1)', fill: true },
{ label: 'Egresos', data: egresosMensuales, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', fill: true }
]
});

const margenes = meses.map((_, i) => {
const ing = ingresosMensuales[i];
const egr = egresosMensuales[i];
return ing > 0 ? ((ing - egr) / ing * 100).toFixed(1) : 0;
});
crearGrafico('chartMargen', 'bar', {
labels: meses,
datasets: [{ label: 'Margen %', data: margenes, backgroundColor: margenes.map(m => m >= 50 ? '#28a745' : m >= 20 ? '#ffc107' : '#dc3545') }]
});
}

function crearGrafico(id, tipo, datos) {
const ctx = document.getElementById(id);
if (!ctx) return;
if (charts[id]) charts[id].destroy();
charts[id] = new Chart(ctx, {
type: tipo,
data: datos,
options: {
responsive: true,
maintainAspectRatio: true,
plugins: { legend: { position: 'bottom' } }
}
});
}

function formatCurrency(value) {
return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(value);
}
