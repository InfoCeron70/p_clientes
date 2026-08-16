/* ============================================
   validaciones.js - Validaciones de formularios
   ============================================ */

/**
 * Valida un correo electrónico
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
export function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida un número de teléfono colombiano
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} true si es válido
 */
export function validarTelefono(telefono) {
    const limpio = telefono.replace(/\s/g, '');
    return /^3\d{9}$/.test(limpio) || /^\d{7,10}$/.test(limpio);
}

/**
 * Valida que un campo no esté vacío
 * @param {string} valor - Valor a validar
 * @returns {boolean} true si no está vacío
 */
export function validarRequerido(valor) {
    return valor !== null && valor !== undefined && valor.toString().trim() !== '';
}

/**
 * Valida una fecha
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {boolean} true si es válida
 */
export function validarFecha(fecha) {
    if (!fecha) return false;
    const d = new Date(fecha);
    return d instanceof Date && !isNaN(d);
}

/**
 * Sanitiza texto para prevenir XSS
 * @param {string} texto - Texto a sanitizar
 * @returns {string} Texto seguro
 */
export function sanitizarTexto(texto) {
    if (!texto) return '';
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
