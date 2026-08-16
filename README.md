# ClientesPro

Sistema web de gestion de clientes con dashboard, tabla de datos, formularios y exportacion a Excel.

## Caracteristicas

- Formulario de clientes con validaciones
- Tabla con busqueda, filtros, ordenamiento y paginacion
- Dashboard con KPIs y graficos (Chart.js)
- Diseno moderno, responsive, modo oscuro/claro
- Exportar a Excel (.xlsx)
- Importar desde Excel (.xlsx)
- 20 registros de ejemplo
- Todo en Vanilla JS

## Demo

Abre la app aqui: https://infoceron70.github.io/p_clientes

## Como usar

1. Descarga o clona este repositorio
2. Abre `index.html` en tu navegador
3. Los datos se guardan en el navegador (localStorage)

## Estructura

```
P_CLIENTES/
├── index.html
├── css/
│   ├── main.css
│   ├── components.css
│   └── formularios.css
├── js/
│   ├── main.js
│   ├── config.js
│   └── modules/
│       ├── clientes.js
│       ├── storage.js
│       ├── ui.js
│       ├── validaciones.js
│       └── charts.js
└── README.md
```

## Tecnologias

- HTML5 / CSS3 / JavaScript (ES6 Modules)
- Chart.js (graficos)
- Font Awesome (iconos)
- SheetJS (Excel)
- localStorage (persistencia)

## Nota

Este proyecto usa localStorage para guardar los datos.
Si borras el cache del navegador, se pierden los datos.
Para persistencia en la nube, se puede conectar a SheetDB o Firebase.
