/* ============================================
   ui.js - Utilidades de interfaz de usuario
   ============================================ */

/**
 * Cambia la vista activa del sidebar
 * @param {string} vista - Nombre de la vista: 'dashboard', 'clientes', 'nuevo'
 */
export function cambiarVista(vista) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    // Mostrar la vista seleccionada
    const vistaEl = document.getElementById(`view-${vista}`);
    if (vistaEl) vistaEl.classList.remove('hidden');

    // Actualizar navegación activa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.view === vista);
    });

    // En móvil, cerrar sidebar
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('open');
}

/**
 * Muestra un toast (notificación)
 * @param {string} mensaje - Texto a mostrar
 * @param {string} tipo - 'success', 'error', 'info'
 * @param {number} duracion - Milisegundos antes de desaparecer
 */
export function mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const iconos = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <i class="fas ${iconos[tipo] || iconos.info}"></i>
        <span class="toast-message">${escapeHtml(mensaje)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, duracion);
}

/**
 * Abre un modal
 * @param {string} id - ID del modal
 */
export function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open');
}

/**
 * Cierra un modal
 * @param {string} id - ID del modal
 */
export function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
}

/**
 * Actualiza el texto de un elemento
 * @param {string} id - ID del elemento
 * @param {string|number} texto - Texto a colocar
 */
export function actualizarTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} texto - Texto a escapar
 * @returns {string} Texto seguro
 */
export function escapeHtml(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

/**
 * Formatea una fecha
 * @param {string} fechaStr - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return fechaStr;
    return fecha.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Inicializa eventos de UI globales
 */
export function initUI() {
    // Toggle sidebar en móvil
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.add('open');
        document.getElementById('sidebarOverlay')?.classList.add('open');
    });

    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('open');
    });

    document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('open');
    });

    // Navegación del sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarVista(link.dataset.view);
        });
    });

    // Toggle tema oscuro/claro
    const toggleTheme = () => {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        html.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');

        // Actualizar iconos
        const iconos = document.querySelectorAll('.theme-toggle i, .theme-toggle-mobile i');
        iconos.forEach(i => {
            i.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        });

        const textos = document.querySelectorAll('.theme-toggle span');
        textos.forEach(t => {
            t.textContent = isDark ? 'Modo Oscuro' : 'Modo Claro';
        });
    };

    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('themeToggleMobile')?.addEventListener('click', toggleTheme);

    // Restaurar tema guardado
    const temaGuardado = localStorage.getItem('theme');
    if (temaGuardado === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.querySelectorAll('.theme-toggle i, .theme-toggle-mobile i').forEach(i => i.className = 'fas fa-sun');
        document.querySelectorAll('.theme-toggle span').forEach(t => t.textContent = 'Modo Claro');
    }
}
