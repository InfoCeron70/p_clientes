/* ============================================
   charts.js - Gráficos con Chart.js
   ============================================ */

let charts = {};

/**
 * Renderiza todos los gráficos del dashboard
 * @param {Array} clientes - Lista de clientes
 */
export function renderizarGraficos(clientes) {
    destruirGraficos();

    if (clientes.length === 0) return;

    renderizarCategorias(clientes);
    renderizarMeses(clientes);
    renderizarEstados(clientes);
    renderizarSatisfaccion(clientes);
}

function destruirGraficos() {
    Object.values(charts).forEach(chart => chart?.destroy?.());
    charts = {};
}

function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        text: isDark ? '#94a3b8' : '#6b7280',
        grid: isDark ? '#334155' : '#e5e7eb'
    };
}

function renderizarCategorias(clientes) {
    const canvas = document.getElementById('chartCategorias');
    if (!canvas) return;

    const conteo = {};
    clientes.forEach(c => { conteo[c.categoria] = (conteo[c.categoria] || 0) + 1; });

    const colores = {
        'VIP': '#8b5cf6',
        'Regular': '#3b82f6',
        'Nuevo': '#10b981',
        'Potencial': '#f59e0b'
    };

    const theme = getThemeColors();

    charts.categorias = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: Object.keys(conteo),
            datasets: [{
                label: 'Clientes',
                data: Object.values(conteo),
                backgroundColor: Object.keys(conteo).map(k => colores[k] || '#4f46e5'),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: theme.text }, grid: { color: theme.grid } },
                x: { ticks: { color: theme.text }, grid: { display: false } }
            }
        }
    });
}

function renderizarMeses(clientes) {
    const canvas = document.getElementById('chartMeses');
    if (!canvas) return;

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const conteo = new Array(12).fill(0);

    clientes.forEach(c => {
        if (c.fecha) {
            const mes = parseInt(c.fecha.split('-')[1]) - 1;
            if (mes >= 0 && mes < 12) conteo[mes]++;
        }
    });

    const theme = getThemeColors();

    charts.meses = new Chart(canvas, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [{
                label: 'Clientes',
                data: conteo,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79,70,229,0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#4f46e5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: theme.text }, grid: { color: theme.grid } },
                x: { ticks: { color: theme.text }, grid: { display: false } }
            }
        }
    });
}

function renderizarEstados(clientes) {
    const canvas = document.getElementById('chartEstados');
    if (!canvas) return;

    const conteo = {};
    clientes.forEach(c => { conteo[c.estado] = (conteo[c.estado] || 0) + 1; });

    const colores = {
        'Activo': '#10b981',
        'Inactivo': '#ef4444',
        'Pendiente': '#f59e0b'
    };

    charts.estados = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: Object.keys(conteo),
            datasets: [{
                data: Object.values(conteo),
                backgroundColor: Object.keys(conteo).map(k => colores[k] || '#4f46e5'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } }
            }
        }
    });
}

function renderizarSatisfaccion(clientes) {
    const canvas = document.getElementById('chartSatisfaccion');
    if (!canvas) return;

    const conteo = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    clientes.forEach(c => {
        const val = parseInt(c.satisfaccion);
        if (val >= 1 && val <= 5) conteo[val]++;
    });

    const theme = getThemeColors();

    charts.satisfaccion = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['1★', '2★', '3★', '4★', '5★'],
            datasets: [{
                label: 'Clientes',
                data: [conteo[1], conteo[2], conteo[3], conteo[4], conteo[5]],
                backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: theme.text }, grid: { color: theme.grid } },
                x: { ticks: { color: theme.text }, grid: { display: false } }
            }
        }
    });
}
