/* ============================================
   storage.js - Capa de almacenamiento

   CORRECCIONES:
   - Usa POST con campo 'action' para todo (compatible con Google Apps Script)
   - NO tiene fallback silencioso a localStorage (para ver errores reales)
   - Manejo correcto de IDs
   ============================================ */

import { API_URL, MODO_LOCAL } from '../config.js';

const STORAGE_KEY = 'clientes_data';

/* ============================================================
   MODO PROXY / GOOGLE SHEETS
   ============================================================ */

export async function obtenerClientes() {
    if (MODO_LOCAL) return obtenerClientesLocal();

    try {
        const response = await fetch(`${API_URL}?action=list`);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const result = await response.json();
        if (result.success) return result.data || [];
        throw new Error(result.error || 'Error desconocido del servidor');
    } catch (error) {
        console.error('ERROR API obtenerClientes:', error);
        throw error;  // NO caer silenciosamente a localStorage
    }
}

export async function obtenerClientePorId(id) {
    if (MODO_LOCAL) return obtenerClientePorIdLocal(id);

    try {
        const response = await fetch(`${API_URL}?action=get&id=${encodeURIComponent(id)}`);
        if (!response.ok) return null;
        const result = await response.json();
        if (result.success) return result.data;
        return null;
    } catch (error) {
        console.error('ERROR API obtenerClientePorId:', error);
        throw error;
    }
}

/**
 * Guarda un cliente (nuevo o existente)
 * CORRECCION: Usa POST con action para todo (mas compatible)
 */
export async function guardarCliente(cliente) {
    if (MODO_LOCAL) return guardarClienteLocal(cliente);

    try {
        // Si tiene ID, es una actualizacion. Si no, es un nuevo cliente.
        const action = cliente.id ? 'update' : 'create';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, ...cliente })
        });

        if (!response.ok) throw new Error('HTTP ' + response.status);
        const result = await response.json();
        if (result.success) return result.data;
        throw new Error(result.error || 'Error al guardar');
    } catch (error) {
        console.error('ERROR API guardarCliente:', error);
        throw error;
    }
}

/**
 * Elimina un cliente por ID
 */
export async function eliminarCliente(id) {
    if (MODO_LOCAL) return eliminarClienteLocal(id);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: id })
        });

        if (!response.ok) throw new Error('HTTP ' + response.status);
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('ERROR API eliminarCliente:', error);
        throw error;
    }
}

/**
 * Exporta todos los clientes
 */
export async function exportarDatos() {
    return obtenerClientes();
}

/* ============================================================
   MODO LOCALSTORAGE (FALLBACK - solo si MODO_LOCAL = true)
   ============================================================ */

function obtenerClientesLocal() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error al leer clientes local:', error);
        return [];
    }
}

function obtenerClientePorIdLocal(id) {
    const clientes = obtenerClientesLocal();
    return clientes.find(c => c.id === id) || null;
}

function guardarClientesLocal(clientes) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
    } catch (error) {
        console.error('Error al guardar clientes local:', error);
    }
}

function guardarClienteLocal(cliente) {
    const clientes = obtenerClientesLocal();

    if (cliente.id) {
        // Actualizar
        const index = clientes.findIndex(c => c.id === cliente.id);
        if (index !== -1) {
            clientes[index] = { ...cliente, actualizado: new Date().toISOString() };
        } else {
            clientes.push({ ...cliente, actualizado: new Date().toISOString() });
        }
    } else {
        // Nuevo
        const nuevoCliente = {
            ...cliente,
            id: generarId(),
            creado: new Date().toISOString(),
            actualizado: new Date().toISOString()
        };
        clientes.push(nuevoCliente);
    }

    guardarClientesLocal(clientes);
    return cliente;
}

function eliminarClienteLocal(id) {
    const clientes = obtenerClientesLocal();
    const filtrados = clientes.filter(c => c.id !== id);
    if (filtrados.length !== clientes.length) {
        guardarClientesLocal(filtrados);
        return true;
    }
    return false;
}

function generarId() {
    return 'CLI' + Date.now() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

export function cargarDatosEjemplo() {
    if (obtenerClientesLocal().length === 0) {
        const ejemplos = generarDatosEjemplo();
        guardarClientesLocal(ejemplos);
    }
}

function generarDatosEjemplo() {
    const nombres = [
        ['Carlos', 'Rodriguez'], ['Maria', 'Gonzalez'], ['Juan', 'Perez'],
        ['Ana', 'Martinez'], ['Luis', 'Hernandez'], ['Sofia', 'Lopez'],
        ['Pedro', 'Garcia'], ['Laura', 'Sanchez'], ['Diego', 'Ramirez'],
        ['Valentina', 'Torres'], ['Andres', 'Flores'], ['Camila', 'Rivera'],
        ['Jose', 'Gomez'], ['Isabella', 'Diaz'], ['Miguel', 'Reyes'],
        ['Luciana', 'Morales'], ['Daniel', 'Ortiz'], ['Mariana', 'Castillo'],
        ['Alejandro', 'Vargas'], ['Victoria', 'Romero']
    ];

    const ciudades = [
        ['Bogota', 'Cundinamarca'], ['Medellin', 'Antioquia'], ['Cali', 'Valle del Cauca'],
        ['Barranquilla', 'Atlantico'], ['Cartagena', 'Bolivar'], ['Bucaramanga', 'Santander'],
        ['Pereira', 'Risaralda'], ['Manizales', 'Caldas'], ['Ibague', 'Tolima'],
        ['Santa Marta', 'Magdalena']
    ];

    const categorias = ['VIP', 'Regular', 'Nuevo', 'Potencial'];
    const estados = ['Activo', 'Inactivo', 'Pendiente'];
    const notas = [
        'Cliente frecuente, muy satisfecho con el servicio.',
        'Requiere seguimiento mensual.',
        'Interesado en nuevos productos.',
        'Cliente referido por un amigo.',
        'Solicito informacion adicional.',
        'Muy exigente con los tiempos de entrega.',
        'Prefiere contacto por WhatsApp.',
        'Cliente corporativo con multiples sucursales.',
        'Primera compra, potencial de crecimiento.',
        'Ha tenido algunos inconvenientes menores.',
        'Excelente relacion comercial.',
        'Necesita capacitacion sobre el producto.',
        'Cliente desde el ano pasado.',
        'Recomienda nuestros servicios.',
        'Pendiente de confirmar proxima orden.',
        'Muy colaborador con feedback.',
        'Solicito descuento por volumen.',
        'Interesado en el plan premium.',
        'Cliente internacional.',
        'Requiere facturacion especial.'
    ];

    const clientes = [];
    const hoy = new Date();

    for (let i = 0; i < 20; i++) {
        const [nombre, apellido] = nombres[i];
        const [ciudad, departamento] = ciudades[i % ciudades.length];
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 365));

        clientes.push({
            id: 'CLI20260813231757' + String(i).padStart(3, '0'),
            nombre: nombre + ' ' + apellido,
            email: nombre.toLowerCase() + '.' + apellido.toLowerCase() + '@email.com',
            telefono: '3' + Math.floor(Math.random() * 90 + 10) + ' ' + Math.floor(Math.random() * 900 + 100) + ' ' + Math.floor(Math.random() * 9000 + 1000),
            ciudad: ciudad,
            departamento: departamento,
            fecha: fecha.toISOString().split('T')[0],
            categoria: categorias[Math.floor(Math.random() * categorias.length)],
            satisfaccion: Math.floor(Math.random() * 5) + 1,
            estado: estados[Math.floor(Math.random() * estados.length)],
            notas: notas[i],
            creado: fecha.toISOString()
        });
    }

    return clientes;
}
