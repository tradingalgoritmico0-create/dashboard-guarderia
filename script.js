// ============================================
// CONFIGURACIÓN - GITHUB JSON
// ============================================
const CONFIG = {
    GITHUB_RAW_URL: 'https://raw.githubusercontent.com/tradingalgoritmico0-create/dashboard-guarderia/main',
    REFRESH_INTERVAL: 30000
};

let data = { alumnos: [], pagos: [], asistencia: [], empresas: [], egresos: [] };
let charts = {};
let filtros = { mes: 'todos', grupo: 'todos' };

document.addEventListener('DOMContentLoaded', function() {
    cargarDatos();
    setInterval(cargarDatos, CONFIG.REFRESH_INTERVAL);
    document.getElementById('refreshBtn').addEventListener('click', cargarDatos);
    document.getElementById('mesFilter').addEventListener('change', function(e) {
        filtros.mes = e.target.value;
        actualizarDashboard();
    });
    document.getElementById('grupoFilter').addEventListener('change', function(e) {
        filtros.grupo = e.target.value;
        actualizarDashboard();
    });
});

async function cargarDatos() {
    try {
        document.getElementById('refreshBtn').innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Actualizando...';
        
        const [alumnos, pagos, asistencia, egresos] = await Promise.all([
            fetchJSON('alumnos.json'),
            fetchJSON('pagos.json'),
            fetchJSON('asistencia.json'),
            fetchJSON('egresos.json')
        ]);
        
        data.alumnos = alumnos || [];
        data.pagos = pagos || [];
        data.asistencia = asistencia || [];
        data.egresos = egresos || [];
        
        console.log('Datos cargados correctamente');
        actualizarDashboard();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar datos. Revisa la consola para más detalles.');
    } finally {
        document.getElementById('refreshBtn').innerHTML = '<i class="bi bi-arrow-clockwise"></i> Actualizar';
    }
}

async function fetchJSON(filename) {
    const url = `${CONFIG.GITHUB_RAW_URL}/${filename}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`No se pudo cargar ${filename}: ${response.status}`);
            return [];
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Error fetching:', filename, error);
        return [];
    }
}

function actualizarDashboard() {
    // KPIs
    const activos = data.alumnos.filter(a => a.status === 'Activo').length;
    const pagosTotal = data.pagos.reduce((s, p) => s + (p.status === 'Pagado' ? p.monto : 0), 0);
    const pagosPendientes = data.pagos.reduce((s, p) => s + (p.status === 'Pendiente' ? p.monto : 0), 0);
    const asistenciaTotal = data.asistencia.length;
    const presente = data.asistencia.filter(a => a.status === 'Presente').length;
    const asistenciaPct = asistenciaTotal > 0 ? Math.round((presente / asistenciaTotal) * 100) : 0;
    const egresosTotal = data.egresos.reduce((s, e) => s + e.monto, 0);
    const balance = pagosTotal - egresosTotal;

    document.getElementById('totalAlumnos').textContent = activos;
    document.getElementById('totalPagos').textContent = formatCurrency(pagosTotal);
    document.getElementById('asistenciaPromedio').textContent = asistenciaPct + '%';
    document.getElementById('balance').textContent = formatCurrency(balance);

    // Gráficos
    updateChart('grupoChart', {
        labels: ['Peque', 'Intermedio', 'Grande'],
        datasets: [{
            data: [
                data.alumnos.filter(a => a.grupo === 'Peque').length,
                data.alumnos.filter(a => a.grupo === 'Intermedio').length,
                data.alumnos.filter(a => a.grupo === 'Grande').length
            ],
            backgroundColor: ['#4a90d9', '#28a745', '#ffc107']
        }]
    }, 'pie');

    const pagosPorAlumno = {};
    data.pagos.forEach(p => { pagosPorAlumno[p.alumno] = (pagosPorAlumno[p.alumno] || 0) + p.monto; });
    updateChart('empresaPagosChart', {
        labels: Object.keys(pagosPorAlumno).slice(0, 5),
        datasets: [{
            data: Object.values(pagosPorAlumno).slice(0, 5),
            backgroundColor: ['#4a90d9', '#28a745', '#ffc107', '#dc3545', '#17a2b8']
        }]
    }, 'pie');

    const egresosPorCat = {};
    data.egresos.forEach(e => { egresosPorCat[e.categoria] = (egresosPorCat[e.categoria] || 0) + e.monto; });
    updateChart('egresosChart', {
        labels: Object.keys(egresosPorCat),
        datasets: [{
            data: Object.values(egresosPorCat),
            backgroundColor: ['#dc3545', '#ffc107', '#28a745', '#17a2b8']
        }]
    }, 'pie');

    const asistenciaPorDia = {};
    data.asistencia.forEach(a => {
        asistenciaPorDia[a.fecha] = (asistenciaPorDia[a.fecha] || 0) + (a.status === 'Presente' ? 1 : 0);
    });
    const labels = Object.keys(asistenciaPorDia).slice(-10);
    const values = labels.map(l => asistenciaPorDia[l]);
    updateChart('asistenciaChart', {
        labels: labels.map(l => l.substring(0, 5)),
        datasets: [{
            label: 'Asistencias',
            data: values,
            backgroundColor: '#4a90d9',
            borderColor: '#4a90d9',
            fill: false,
            tension: 0.3
        }]
    }, 'line');

    // Tablas
    const tbodyPagos = document.querySelector('#tablaPagos tbody');
    tbodyPagos.innerHTML = data.pagos.slice(-10).reverse().map(p => 
        `<tr><td>${p.fecha}</td><td>${p.alumno}</td><td>${p.mes}</td><td>${formatCurrency(p.monto)}</td><td>${p.tipo}</td><td><span class="badge ${p.status === 'Pagado' ? 'bg-success' : 'bg-warning'}">${p.status}</span></td></tr>`
    ).join('');
    document.getElementById('pagosBadge').textContent = data.pagos.length;

    const tbodyAlumnos = document.querySelector('#tablaAlumnos tbody');
    tbodyAlumnos.innerHTML = data.alumnos.filter(a => a.status === 'Activo').slice(0, 10).map(a => 
        `<tr><td>${a.nombre}</td><td><span class="badge bg-primary">${a.grupo}</span></td><td>${a.tutor}</td><td>${a.empresa}</td><td><span class="badge bg-success">${a.status}</span></td></tr>`
    ).join('');
    document.getElementById('alumnosBadge').textContent = activos;

    const tbodyEgresos = document.querySelector('#tablaEgresos tbody');
    tbodyEgresos.innerHTML = data.egresos.slice(-10).reverse().map(e => 
        `<tr><td>${e.fecha}</td><td>${e.descripcion}</td><td>${formatCurrency(e.monto)}</td><td>${e.categoria}</td></tr>`
    ).join('');
    document.getElementById('egresosBadge').textContent = data.egresos.length;

    // Alertas
    const alertas = [];
    if (pagosPendientes > 0) alertas.push(`<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> Pagos pendientes: ${formatCurrency(pagosPendientes)}</div>`);
    const ausentes = data.asistencia.filter(a => a.status === 'Ausente').length;
    if (ausentes > 0) alertas.push(`<div class="alert alert-danger"><i class="bi bi-person-dash"></i> Total ausencias: ${ausentes}</div>`);
    document.getElementById('alertasContent').innerHTML = alertas.length ? alertas.join('') : '<div class="alert alert-success"><i class="bi bi-check-circle"></i> Sin alertas</div>';
}

function updateChart(id, chartData, type) {
    const ctx = document.getElementById(id).getContext('2d');
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, { type, data: chartData, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } } });
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(value);
}
