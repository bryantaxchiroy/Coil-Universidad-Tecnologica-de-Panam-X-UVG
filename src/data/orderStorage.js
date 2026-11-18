import { cartTotals, clearCart, getCart, isCartItem } from './cartStorage.js'

export const ORDERS_STORAGE_KEY = 'trama-orders'

export function orderStages(deliveryMethod) {
  return ['Pagado', 'En cola', 'En impresión', deliveryMethod === 'retiro' ? 'Listo para retirar' : 'En camino', 'Entregado']
}

export function getOrders(storage = window.localStorage) {
  try {
    const saved = storage.getItem(ORDERS_STORAGE_KEY)
    const orders = saved === null ? [] : JSON.parse(saved)
    if (!Array.isArray(orders) || !orders.every((order) => order && typeof order.id === 'string' && typeof order.createdAt === 'string' && Number.isFinite(Date.parse(order.createdAt)) && Array.isArray(order.items) && order.items.every(isCartItem) && Number.isFinite(order.total) && order.total >= 0 && order.delivery && ['envio', 'retiro'].includes(order.delivery.method) && orderStages(order.delivery.method).includes(order.status))) throw new Error('invalid-orders')
    return orders
  } catch {
    throw new Error('No se pudieron leer los pedidos guardados. Los datos podrían estar dañados o el almacenamiento no está disponible.')
  }
}

export function saveOrders(orders, storage = window.localStorage) {
  try { storage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders)) }
  catch (error) {
    if (error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014) throw new Error('No hay espacio suficiente para guardar el pedido. El carrito permanece intacto; libera espacio o usa imágenes más pequeñas e inténtalo de nuevo.')
    throw new Error('No se pudo guardar el pedido. El carrito permanece intacto; revisa el almacenamiento del navegador.')
  }
}

export function findOrder(id, storage = window.localStorage) {
  return getOrders(storage).find((order) => order.id.toLowerCase() === id.trim().toLowerCase()) || null
}

export function validateCheckout({ customer, delivery }) {
  const errors = {}
  if (!customer.fullName?.trim()) errors.fullName = 'Escribe tu nombre completo.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email?.trim() || '')) errors.email = 'Escribe un correo electrónico válido.'
  if ((customer.phone || '').replace(/\D/g, '').length < 7) errors.phone = 'Escribe un teléfono válido de al menos 7 dígitos.'
  if (!['envio', 'retiro'].includes(delivery.method)) errors.method = 'Elige un método de entrega.'
  if (delivery.method === 'envio' && !delivery.address?.trim()) errors.address = 'Escribe la dirección de entrega.'
  return errors
}

export function createOrder(details, storage = window.localStorage, { idFactory = () => crypto.randomUUID(), now = () => new Date() } = {}) {
  if (Object.keys(validateCheckout(details)).length) throw new Error('Completa los datos obligatorios antes de confirmar el pedido.')
  const items = getCart(storage)
  if (!items.length) throw new Error('El carrito está vacío. Agrega una camiseta antes de confirmar.')
  const previous = getOrders(storage)
  const date = now()
  const order = {
    id: `TRM-${date.getTime().toString(36).toUpperCase()}-${idFactory().slice(0, 8).toUpperCase()}`,
    createdAt: date.toISOString(),
    customer: {
      fullName: details.customer.fullName.trim(),
      email: details.customer.email.trim(),
      phone: details.customer.phone.trim(),
    },
    delivery: { method: details.delivery.method, address: details.delivery.method === 'envio' ? details.delivery.address.trim() : '' },
    items: structuredClone(items),
    subtotal: cartTotals(items).subtotal,
    total: cartTotals(items).total,
    status: 'Pagado',
  }
  saveOrders([...previous, order], storage)
  try {
    clearCart(storage)
    return { order, warning: '' }
  } catch {
    // The order is already saved: never submit it a second time to retry clearing the cart.
    return { order, warning: 'El pedido quedó confirmado, pero no se pudo vaciar el carrito. Revisa el almacenamiento del navegador antes de crear otro pedido.' }
  }
}
