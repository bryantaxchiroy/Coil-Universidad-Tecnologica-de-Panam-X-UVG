# Trama — Tienda de Camisetas Personalizadas

Prototipo frontend responsivo de una tienda de camisetas personalizadas, desarrollado con React, Vite, JavaScript, Tailwind CSS, React Router y Lucide React.

## Ejecutar desde Visual Studio Code

1. Abre esta carpeta en Visual Studio Code.
2. Abre la terminal integrada (**Terminal > Nuevo terminal**).
3. Ejecuta `npm install` y luego `npm run dev`.
4. Abre la dirección local que muestra Vite (normalmente `http://localhost:5173/`).

Para verificar la compilación de producción, ejecuta `npm run build`.
Para ejecutar las pruebas de catálogo, carrito, pedidos y almacenamiento, usa `npm test`.

## Estructura

- `src/components/`: componentes compartidos, miniaturas, detalles y progreso de pedidos.
- `src/pages/`: inicio, catálogo, personalizador, carrito, checkout, confirmación, seguimiento y página 404.
- `src/routes/`: definición de rutas de la aplicación.
- `src/data/`: camisetas simuladas, configuración, utilidades del carrito y persistencia de pedidos.
- `src/styles/`: Tailwind y estilos globales.
- `public/images/`: ilustraciones SVG locales de los productos.

El catálogo permite buscar y filtrar por categoría, talla y color. El personalizador muestra los cambios en tiempo real, acepta texto e imágenes PNG/JPG de hasta 1 MB y guarda artículos en `localStorage` bajo la clave `trama-cart`. Cada artículo conserva su ID, producto, precio unitario total, precio base, costo adicional, talla, color, propiedades del texto, imagen (como data URL) y cantidad.

Desde Inicio, «Ver mi carrito» muestra el número total de unidades y se actualiza cuando cambia el carrito, incluso desde otra pestaña. El personalizador permite elegir de 1 a 99 camisetas por artículo antes de agregarlo y muestra precio unitario y total por cantidad; no hay inventario simulado por producto.

El carrito admite cambios de cantidad y eliminación. El checkout solicita datos de contacto y entrega, simula la confirmación sin pedir tarjetas y guarda los pedidos en `localStorage` bajo la clave `trama-orders`, sin sobrescribir los anteriores. Cada pedido incluye ID, fecha, datos de contacto, método y dirección de entrega, copia independiente de artículos, subtotal, total y estado inicial «Pagado». El seguimiento busca por ID y muestra las etapas según el método de entrega.

El panel de administración sigue siendo provisional; los estados de los pedidos podrán actualizarse en una etapa posterior. No se necesita backend ni se procesan pagos reales. Las imágenes guardadas ocupan espacio en el navegador; si se agota, la aplicación muestra un error sin perder el carrito ni los pedidos previos.
