/* ============================================
   main.js - Punto de entrada de la aplicación
   ============================================ */

import * as ui from './modules/ui.js';
import * as clientes from './modules/clientes.js';

document.addEventListener('DOMContentLoaded', () => {
    ui.initUI();
    clientes.init();
});
