/* ============================================
   clientes.js - Logica CRUD de clientes + Importar Excel
   ============================================ */

import * as storage from './storage.js';
import * as ui from './ui.js';

let clientes = [];
let clienteEditando = null;
let clienteEliminarId = null;
let clientesAImportar = [];
let erroresImportacion = [];

const ITEMS_POR_PAGINA = 8;
let paginaActual = 1;
let clientesFiltrados = [];
let ordenColumna = '';
let ordenAscendente = true;

export async function init() {
    await cargarClientes();
    setupEventListeners();
}

async function cargarClientes() {
    try {
        clientes = await storage.obtenerClientes();
        aplicarFiltrosYOrdenamiento();
    } catch (error) {
        ui.mostrarToast('Error al cargar clientes: ' + error.message, 'error');
    }
}

function aplicarFiltrosYOrdenamiento() {
    const busqueda = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const filtroCategoria = document.getElementById('filterCategoria')?.value || '';
    const filtroEstado = document.getElementById('filterEstado')?.value || '';

    clientesFiltrados = clientes.filter(c => {
        const coincideBusqueda = !busqueda ||
            (c.nombre || '').toLowerCase().includes(busqueda) ||
            (c.email || '').toLowerCase().includes(busqueda) ||
            (c.ciudad || '').toLowerCase().includes(busqueda);
        const coincideCategoria = !filtroCategoria || c.categoria === filtroCategoria;
        const coincideEstado = !filtroEstado || c.estado === filtroEstado;
        return coincideBusqueda && coincideCategoria && coincideEstado;
    });

    if (ordenColumna) {
        clientesFiltrados.sort((a, b) => {
            let valA = a[ordenColumna] || '';
            let valB = b[ordenColumna] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return ordenAscendente ? -1 : 1;
            if (valA > valB) return ordenAscendente ? 1 : -1;
            return 0;
        });
    }

    renderizarTabla();
    renderizarPaginacion();
    actualizarDashboard();
}

function renderizarTabla() {
    const tbody = document.getElementById('tablaBody');
    if (!tbody) return;

    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    const paginaClientes = clientesFiltrados.slice(inicio, fin);

    if (paginaClientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="padding:3rem;text-align:center;color:var(--text-secondary)"><i class="fas fa-search" style="font-size:2rem;display:block;margin-bottom:.5rem"></i>No se encontraron clientes</td></tr>';
        return;
    }

    tbody.innerHTML = paginaClientes.map(c => `
        <tr data-id="${c.id}">
            <td><strong>${ui.escapeHtml(c.nombre)}</strong></td>
            <td>${ui.escapeHtml(c.email)}</td>
            <td>${ui.escapeHtml(c.telefono)}</td>
            <td>${ui.escapeHtml(c.ciudad)}</td>
            <td><span class="badge badge-${(c.categoria || '').toLowerCase()}">${c.categoria}</span></td>
            <td><span class="stars">${renderizarEstrellas(c.satisfaccion)}</span></td>
            <td><span class="badge badge-${(c.estado || '').toLowerCase()}">${c.estado}</span></td>
            <td>
                <div class="actions">
                    <button class="btn-icon edit" onclick="window.editarCliente('${c.id}')" title="Editar"><i class="fas fa-pen"></i></button>
                    <button class="btn-icon delete" onclick="window.confirmarEliminar('${c.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderizarEstrellas(valor) {
    const v = parseInt(valor) || 0;
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= v ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return html;
}

function renderizarPaginacion() {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPaginas = Math.ceil(clientesFiltrados.length / ITEMS_POR_PAGINA) || 1;
    if (totalPaginas <= 1) { container.innerHTML = ''; return; }

    let html = `<button ${paginaActual === 1 ? 'disabled' : ''} onclick="window.cambiarPagina(${paginaActual - 1})"><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPaginas; i++) {
        html += `<button class="${i === paginaActual ? 'active' : ''}" onclick="window.cambiarPagina(${i})">${i}</button>`;
    }
    html += `<button ${paginaActual === totalPaginas ? 'disabled' : ''} onclick="window.cambiarPagina(${paginaActual + 1})"><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
}

function actualizarDashboard() {
    const total = clientes.length;
    const activos = clientes.filter(c => c.estado === 'Activo').length;
    const satisfaccion = total > 0 ? (clientes.reduce((sum, c) => sum + (parseInt(c.satisfaccion) || 0), 0) / total).toFixed(1) : '0';
    const ciudades = new Set(clientes.map(c => c.ciudad).filter(Boolean)).size;

    ui.actualizarTexto('kpiTotal', total);
    ui.actualizarTexto('kpiActivos', activos);
    ui.actualizarTexto('kpiSatisfaccion', satisfaccion);
    ui.actualizarTexto('kpiCiudades', ciudades);

    import('./charts.js').then(mod => mod.renderizarGraficos(clientes));
}

function setupEventListeners() {
    document.getElementById('searchInput')?.addEventListener('input', () => { paginaActual = 1; aplicarFiltrosYOrdenamiento(); });
    document.getElementById('filterCategoria')?.addEventListener('change', () => { paginaActual = 1; aplicarFiltrosYOrdenamiento(); });
    document.getElementById('filterEstado')?.addEventListener('change', () => { paginaActual = 1; aplicarFiltrosYOrdenamiento(); });

    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const campo = th.dataset.sort;
            if (ordenColumna === campo) ordenAscendente = !ordenAscendente;
            else { ordenColumna = campo; ordenAscendente = true; }
            document.querySelectorAll('.sortable i').forEach(i => i.className = 'fas fa-sort');
            const icono = th.querySelector('i');
            if (icono) icono.className = ordenAscendente ? 'fas fa-sort-up' : 'fas fa-sort-down';
            aplicarFiltrosYOrdenamiento();
        });
    });

    document.getElementById('btnNuevoCliente')?.addEventListener('click', () => {
        clienteEditando = null;
        resetearFormulario();
        ui.cambiarVista('nuevo');
    });

    document.getElementById('btnCancelar')?.addEventListener('click', () => {
        ui.cambiarVista('clientes');
        resetearFormulario();
    });

    document.getElementById('formCliente')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarClienteDesdeFormulario();
    });

    document.querySelectorAll('#starRating button').forEach(btn => {
        btn.addEventListener('click', () => {
            const valor = btn.dataset.value;
            document.getElementById('satisfaccion').value = valor;
            document.querySelectorAll('#starRating button').forEach((b, i) => {
                b.classList.toggle('active', i < valor);
                b.innerHTML = i < valor ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
            });
            const textos = ['', 'Muy insatisfecho', 'Insatisfecho', 'Neutral', 'Satisfecho', 'Muy satisfecho'];
            document.getElementById('ratingText').textContent = textos[valor] || 'Selecciona una calificacion';
        });
    });

    document.getElementById('btnCancelarEliminar')?.addEventListener('click', () => ui.cerrarModal('modalEliminar'));
    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', ejecutarEliminar);
    document.getElementById('btnExportarExcel')?.addEventListener('click', exportarExcel);

    // === IMPORTAR EXCEL ===
    document.getElementById('btnImportarExcel')?.addEventListener('click', () => ui.abrirModal('modalImportar'));
    document.getElementById('btnCancelarImportar')?.addEventListener('click', () => { ui.cerrarModal('modalImportar'); resetearImportar(); });
    document.getElementById('btnConfirmarImportar')?.addEventListener('click', ejecutarImportar);
    setupImportarDragDrop();
}

/* ============================================================
   FUNCIONES PUBLICAS
   ============================================================ */

window.editarCliente = async function(id) {
    const cliente = await storage.obtenerClientePorId(id);
    if (!cliente) { ui.mostrarToast('Cliente no encontrado', 'error'); return; }

    clienteEditando = cliente;
    document.getElementById('clienteId').value = cliente.id;
    document.getElementById('nombre').value = cliente.nombre || '';
    document.getElementById('email').value = cliente.email || '';
    document.getElementById('telefono').value = cliente.telefono || '';
    document.getElementById('ciudad').value = cliente.ciudad || '';
    document.getElementById('departamento').value = cliente.departamento || '';
    document.getElementById('fecha').value = cliente.fecha || '';
    document.getElementById('categoria').value = cliente.categoria || '';
    document.getElementById('estado').value = cliente.estado || '';
    document.getElementById('notas').value = cliente.notas || '';

    const sat = parseInt(cliente.satisfaccion) || 0;
    document.getElementById('satisfaccion').value = sat;
    document.querySelectorAll('#starRating button').forEach((b, i) => {
        b.classList.toggle('active', i < sat);
        b.innerHTML = i < sat ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    });
    const textos = ['', 'Muy insatisfecho', 'Insatisfecho', 'Neutral', 'Satisfecho', 'Muy satisfecho'];
    document.getElementById('ratingText').textContent = textos[sat] || 'Selecciona una calificacion';

    document.getElementById('formTitle').textContent = 'Editar Cliente';
    document.getElementById('formSubtitle').textContent = 'Modificando: ' + cliente.nombre;
    document.getElementById('btnGuardarText').textContent = 'Actualizar Cliente';

    ui.cambiarVista('nuevo');
};

window.confirmarEliminar = async function(id) {
    const cliente = await storage.obtenerClientePorId(id);
    if (!cliente) return;
    clienteEliminarId = id;
    document.getElementById('clienteEliminarNombre').textContent = cliente.nombre;
    ui.abrirModal('modalEliminar');
};

window.cambiarPagina = function(pagina) {
    paginaActual = pagina;
    renderizarTabla();
    renderizarPaginacion();
};

/* ============================================================
   GUARDAR / ELIMINAR CLIENTE
   ============================================================ */

async function guardarClienteDesdeFormulario() {
    const errores = validarFormulario();
    if (errores.length > 0) { ui.mostrarToast(errores[0], 'error'); return; }

    const cliente = {
        id: clienteEditando ? clienteEditando.id : '',
        nombre: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        ciudad: document.getElementById('ciudad').value.trim(),
        departamento: document.getElementById('departamento').value.trim(),
        fecha: document.getElementById('fecha').value,
        categoria: document.getElementById('categoria').value,
        estado: document.getElementById('estado').value,
        satisfaccion: parseInt(document.getElementById('satisfaccion').value) || 0,
        notas: document.getElementById('notas').value.trim()
    };

    try {
        await storage.guardarCliente(cliente);
        ui.mostrarToast(clienteEditando ? 'Cliente actualizado' : 'Cliente creado', 'success');
        await cargarClientes();
        ui.cambiarVista('clientes');
        resetearFormulario();
    } catch (error) {
        ui.mostrarToast('Error: ' + error.message, 'error');
    }
}

async function ejecutarEliminar() {
    if (!clienteEliminarId) return;
    try {
        await storage.eliminarCliente(clienteEliminarId);
        ui.mostrarToast('Cliente eliminado', 'success');
        await cargarClientes();
    } catch (error) {
        ui.mostrarToast('Error al eliminar: ' + error.message, 'error');
    }
    ui.cerrarModal('modalEliminar');
    clienteEliminarId = null;
}

function validarFormulario() {
    const errores = [];
    const campos = ['nombre', 'email', 'telefono', 'ciudad', 'departamento', 'fecha', 'categoria', 'estado'];
    campos.forEach(campo => {
        const input = document.getElementById(campo);
        const errorEl = document.getElementById('error-' + campo);
        if (!input.value.trim()) {
            errores.push('El campo ' + campo + ' es obligatorio');
            input.classList.add('error');
            if (errorEl) errorEl.textContent = 'Este campo es obligatorio';
        } else {
            input.classList.remove('error');
            if (errorEl) errorEl.textContent = '';
        }
    });

    const email = document.getElementById('email').value;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errores.push('El correo no es valido');
        document.getElementById('email').classList.add('error');
    }

    if (!document.getElementById('satisfaccion').value) {
        errores.push('Debes seleccionar satisfaccion');
        document.getElementById('error-satisfaccion').textContent = 'Selecciona una calificacion';
    } else {
        document.getElementById('error-satisfaccion').textContent = '';
    }

    return errores;
}

function resetearFormulario() {
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('satisfaccion').value = '';
    document.querySelectorAll('#starRating button').forEach(b => {
        b.classList.remove('active');
        b.innerHTML = '<i class="far fa-star"></i>';
    });
    document.getElementById('ratingText').textContent = 'Selecciona una calificacion';
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('input, select').forEach(el => el.classList.remove('error'));
    document.getElementById('formTitle').textContent = 'Nuevo Cliente';
    document.getElementById('formSubtitle').textContent = 'Completa la informacion';
    document.getElementById('btnGuardarText').textContent = 'Guardar Cliente';
    clienteEditando = null;
}

/* ============================================================
   EXPORTAR EXCEL
   ============================================================ */

async function exportarExcel() {
    try {
        const datos = await storage.exportarDatos();
        if (datos.length === 0) { ui.mostrarToast('No hay datos', 'info'); return; }

        if (typeof XLSX === 'undefined') {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        const ws = XLSX.utils.json_to_sheet(datos.map(c => ({
            'ID': c.id, 'Nombre': c.nombre, 'Email': c.email, 'Telefono': c.telefono,
            'Ciudad': c.ciudad, 'Departamento': c.departamento, 'Fecha': c.fecha,
            'Categoria': c.categoria, 'Satisfaccion': c.satisfaccion, 'Estado': c.estado,
            'Notas': c.notas, 'Creado': c.creado
        })));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
        XLSX.writeFile(wb, 'Clientes_' + new Date().toISOString().split('T')[0] + '.xlsx');
        ui.mostrarToast('Excel exportado', 'success');
    } catch (error) {
        ui.mostrarToast('Error al exportar: ' + error.message, 'error');
    }
}

/* ============================================================
   IMPORTAR EXCEL
   ============================================================ */

function setupImportarDragDrop() {
    const dropzone = document.getElementById('importDropzone');
    const input = document.getElementById('importFileInput');
    if (!dropzone || !input) return;

    dropzone.addEventListener('click', () => input.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) procesarArchivoExcel(e.dataTransfer.files[0]);
    });

    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) procesarArchivoExcel(e.target.files[0]);
    });
}

async function procesarArchivoExcel(file) {
    clientesAImportar = [];
    erroresImportacion = [];

    if (typeof XLSX === 'undefined') {
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (e) {
            ui.mostrarToast('Error al cargar libreria Excel', 'error');
            return;
        }
    }

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        if (jsonData.length < 2) {
            ui.mostrarToast('El archivo esta vacio o no tiene datos', 'error');
            return;
        }

        const headers = jsonData[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, ''));
        const filas = jsonData.slice(1);

        const mapaColumnas = {
            nombre: ['nombre', 'name', 'nombres', 'cliente'],
            email: ['email', 'correo', 'e-mail', 'mail'],
            telefono: ['telefono', 'telefono', 'phone', 'celular', 'movil', 'movil'],
            ciudad: ['ciudad', 'city'],
            departamento: ['departamento', 'depto', 'state', 'provincia'],
            fecha: ['fecha', 'date', 'fecharegistro', 'fecha_registro'],
            categoria: ['categoria', 'categoria', 'category', 'tipo'],
            satisfaccion: ['satisfaccion', 'satisfaccion', 'satisfaction', 'calificacion', 'calificacion', 'estrellas'],
            estado: ['estado', 'status', 'state', 'situacion', 'situacion'],
            notas: ['notas', 'notes', 'observaciones', 'comentarios', 'descripcion', 'descripcion']
        };

        const indices = {};
        for (const [campo, sinonimos] of Object.entries(mapaColumnas)) {
            for (const s of sinonimos) {
                const idx = headers.indexOf(s);
                if (idx !== -1) { indices[campo] = idx; break; }
            }
        }

        if (indices.nombre === undefined || indices.email === undefined) {
            ui.mostrarToast('El archivo debe tener columnas "nombre" y "email"', 'error');
            return;
        }

        filas.forEach((fila, idx) => {
            const cliente = {
                nombre: String(fila[indices.nombre] || '').trim(),
                email: String(fila[indices.email] || '').trim(),
                telefono: indices.telefono !== undefined ? String(fila[indices.telefono] || '').trim() : '',
                ciudad: indices.ciudad !== undefined ? String(fila[indices.ciudad] || '').trim() : '',
                departamento: indices.departamento !== undefined ? String(fila[indices.departamento] || '').trim() : '',
                fecha: indices.fecha !== undefined ? formatearFechaExcel(fila[indices.fecha]) : new Date().toISOString().split('T')[0],
                categoria: indices.categoria !== undefined ? String(fila[indices.categoria] || 'Nuevo').trim() : 'Nuevo',
                satisfaccion: indices.satisfaccion !== undefined ? parseInt(fila[indices.satisfaccion]) || 3 : 3,
                estado: indices.estado !== undefined ? String(fila[indices.estado] || 'Activo').trim() : 'Activo',
                notas: indices.notas !== undefined ? String(fila[indices.notas] || '').trim() : ''
            };

            const erroresFila = [];
            if (!cliente.nombre) erroresFila.push('Nombre vacio');
            if (!cliente.email) erroresFila.push('Email vacio');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) erroresFila.push('Email invalido');

            if (erroresFila.length > 0) {
                erroresImportacion.push('Fila ' + (idx + 2) + ': ' + erroresFila.join(', '));
            } else {
                clientesAImportar.push(cliente);
            }
        });

        document.getElementById('importCount').textContent = clientesAImportar.length;
        const erroresEl = document.getElementById('importErrors');
        if (erroresImportacion.length > 0) {
            erroresEl.innerHTML = erroresImportacion.map(e => '<div class="error-item">' + e + '</div>').join('');
        } else {
            erroresEl.innerHTML = '<div style="color:var(--color-success)"><i class="fas fa-check-circle"></i> Todas las filas son validas</div>';
        }
        document.getElementById('importPreview').classList.remove('hidden');
        document.getElementById('btnConfirmarImportar').disabled = clientesAImportar.length === 0;

    } catch (error) {
        console.error('Error leyendo Excel:', error);
        ui.mostrarToast('Error al leer el archivo: ' + error.message, 'error');
    }
}

function formatearFechaExcel(valor) {
    if (!valor) return new Date().toISOString().split('T')[0];
    if (typeof valor === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const fecha = new Date(excelEpoch.getTime() + valor * 24 * 60 * 60 * 1000);
        return fecha.toISOString().split('T')[0];
    }
    const fecha = new Date(valor);
    if (!isNaN(fecha)) return fecha.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
}

async function ejecutarImportar() {
    if (clientesAImportar.length === 0) return;

    const btn = document.getElementById('btnConfirmarImportar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';

    let exitosos = 0;
    let fallidos = 0;

    for (const cliente of clientesAImportar) {
        try {
            await storage.guardarCliente(cliente);
            exitosos++;
        } catch (error) {
            console.error('Error importando:', cliente.nombre, error);
            fallidos++;
        }
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-upload"></i> Importar';

    ui.cerrarModal('modalImportar');
    resetearImportar();

    if (fallidos > 0) {
        ui.mostrarToast(exitosos + ' importados, ' + fallidos + ' fallidos', 'info');
    } else {
        ui.mostrarToast(exitosos + ' clientes importados correctamente', 'success');
    }

    await cargarClientes();
}

function resetearImportar() {
    clientesAImportar = [];
    erroresImportacion = [];
    document.getElementById('importFileInput').value = '';
    document.getElementById('importPreview').classList.add('hidden');
    document.getElementById('importErrors').innerHTML = '';
    document.getElementById('btnConfirmarImportar').disabled = true;
    const dropzone = document.getElementById('importDropzone');
    if (dropzone) dropzone.classList.remove('dragover');
}
