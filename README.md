# Trama — Tienda de Camisetas Personalizadas

Prototipo frontend responsivo de una tienda de camisetas personalizadas, desarrollado con React, Vite, JavaScript, Tailwind CSS, React Router y Lucide React.

## Ejecutar desde Visual Studio Code

1. Abre esta carpeta en Visual Studio Code.
2. Abre la terminal integrada (**Terminal > Nuevo terminal**).
3. Ejecuta `npm install` y luego `npm run dev`.
4. Abre la dirección local que muestra Vite (normalmente `http://localhost:5173/`).

Para verificar la compilación de producción, ejecuta `npm run build`.
Para ejecutar las pruebas de catálogo, carrito, pedidos e inventario, usa `npm test`.

## Estructura

- `src/components/`: componentes compartidos, miniaturas, detalles y progreso de pedidos.
- `src/pages/`: inicio, catálogo, personalizador, carrito, checkout, confirmación, seguimiento, administración y página 404.
- `src/routes/`: definición de rutas de la aplicación.
- `src/data/`: camisetas simuladas, configuración, utilidades del carrito y persistencia de productos, pedidos e inventario.
- `src/styles/`: Tailwind y estilos globales.
- `public/images/`: ilustraciones SVG locales de los productos.

El catálogo permite buscar y filtrar por categoría, talla y color. El personalizador edita múltiples textos e imágenes PNG/JPG de hasta 1 MB, y guarda artículos en `localStorage` bajo la clave `trama-cart`.

Desde Inicio, «Ver mi carrito» muestra el número total de unidades y se actualiza cuando cambia el carrito, incluso desde otra pestaña. El personalizador permite elegir de 1 a 99 camisetas por artículo, sujetas a las existencias de la variante seleccionada.

El carrito admite cambios de cantidad y eliminación. El checkout solicita datos de contacto y entrega, simula la confirmación sin pedir tarjetas y guarda los pedidos en `localStorage` bajo la clave `trama-orders`, sin sobrescribir los anteriores. Cada pedido incluye ID, fecha, datos de contacto, método y dirección de entrega, copia independiente de artículos, subtotal, total y estado inicial «Pagado». El seguimiento busca por ID y muestra las etapas según el método de entrega.

La administración de demostración permite actualizar estados de pedidos, editar productos y ajustar inventario por producto, color y talla. Las camisetas originales tienen una base explícita de **20 unidades de demostración por variante**; al leer inventario por primera vez se descuentan los pedidos históricos, sin escribir ni sobrescribir un inventario existente. Los productos nuevos y sus variantes nuevas comienzan en cero. Las variantes retiradas conservan su saldo almacenado y los pedidos históricos no se modifican.

### Conciliación del inventario en checkout

Antes de confirmar, se agrupan las unidades del carrito por variante y se verifica el stock. La operación escribe un marcador `trama-inventory-pending`, guarda el pedido en `trama-orders`, descuenta el stock en `trama-inventory` registrando el ID del pedido en `appliedOrders`, retira el marcador y solo entonces vacía `trama-cart`. Si falla el guardado del pedido, no se descuenta. Si el pedido se guardó pero falló el descuento, queda marcado como pendiente, el carrito se conserva y el siguiente acceso al inventario intenta conciliarlo; el ID aplicado evita un segundo descuento. Un reintento con el mismo carrito reutiliza el pedido confirmado.

**Límite técnico:** `localStorage` no tiene transacciones ni bloqueo entre pestañas o dispositivos. Dos compras simultáneas desde pestañas distintas podrían competir y producir una inconsistencia que requiera conciliación manual; el prototipo no ofrece sincronización entre dispositivos ni seguridad real. No se deben usar datos de pago o clientes reales. Los errores de almacenamiento se muestran sin ocultar las operaciones pendientes.
