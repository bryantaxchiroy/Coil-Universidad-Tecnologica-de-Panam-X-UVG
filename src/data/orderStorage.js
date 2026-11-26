import { cartTotals, clearCart, getCart, isCartItem } from './cartStorage.js'
import { getProducts } from './productStorage.js'
import { INVENTORY_PENDING_KEY, applyOrderInventory, getInventory, validateStock } from './inventoryStorage.js'

export const ORDERS_STORAGE_KEY = 'trama-orders'
export const ORDERS_CHANGE_EVENT = 'trama:orders-change'

export function orderStages(deliveryMethod) {
  return ['Pagado', 'En cola', 'En impresión', deliveryMethod === 'retiro' ? 'Listo para retirar' : 'En camino', 'Entregado']
}

export function subscribeOrders(listener) {
  window.addEventListener(ORDERS_CHANGE_EVENT, listener)
  const onStorage = (event) => {
    if (event.key === ORDERS_STORAGE_KEY || event.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(ORDERS_CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function orderIndicators(orders) {
  return {
    total: orders.length,
    paid: orders.filter((order) => order.status === 'Pagado').length,
    production: orders.filter((order) => ['En cola', 'En impresión'].includes(order.status)).length,
    completed: orders.filter((order) => order.status === 'Entregado').length,
    revenue: Math.round(orders.reduce((sum, order) => sum + Math.round(order.total * 100), 0)) / 100,
  }
}

export function filterOrders(orders, { query = '', status = '' } = {}) {
  const search = query.trim().toLocaleLowerCase('es')
  return orders
    .filter((order) => (!status || order.status === status) && order.id.toLocaleLowerCase('es').includes(search))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export function nextOrderStatus(order) {
  const stages = orderStages(order.delivery.method)
  return stages[stages.indexOf(order.status) + 1] || null
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
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ORDERS_CHANGE_EVENT))
  return orders
}

export function findOrder(id, storage = window.localStorage) {
  return getOrders(storage).find((order) => order.id.toLowerCase() === id.trim().toLowerCase()) || null
}

export function updateOrderStatus(id, status, storage = window.localStorage, { now = () => new Date() } = {}) {
  const orders = getOrders(storage)
  const index = orders.findIndex((order) => order.id.toLowerCase() === id.trim().toLowerCase())
  if (index < 0) throw new Error('El pedido ya no existe. Actualiza la lista antes de continuar.')
  const order = orders[index]
  const next = nextOrderStatus(order)
  if (!next || status !== next) throw new Error(`Transición no permitida: solo puedes avanzar al siguiente estado${next ? ` (${next})` : '; este pedido ya fue entregado'}.`)
  const at = now().toISOString()
  const updated = { ...order, status, statusHistory: [...(order.statusHistory || [{ status: 'Pagado', at: order.createdAt }]), { status, at }] }
  saveOrders(orders.map((entry, position) => position === index ? updated : entry), storage)
  return updated
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

export function createOrder(details, storage = window.localStorage, { idFactory = () => crypto.randomUUID(), now = () => new Date(), expectedItems } = {}) {
  if (Object.keys(validateCheckout(details)).length) throw new Error('Completa los datos obligatorios antes de confirmar el pedido.')
  const items = getCart(storage)
  if (expectedItems && JSON.stringify(items) !== JSON.stringify(expectedItems)) {
    throw new Error('El carrito cambió desde que abriste el checkout. Vuelve al carrito y revisa los artículos y el total antes de confirmar.')
  }
  if (!items.length) throw new Error('El carrito está vacío. Agrega una camiseta antes de confirmar.')
  const available = getProducts(storage)
  const previous = getOrders(storage)
  const checkoutKey = JSON.stringify(items.map((item) => [item.id, item.productId, item.color, item.size, item.quantity, item.price]).sort((a, b) => a[0].localeCompare(b[0])))
  const existing = previous.find((order) => order.checkoutKey === checkoutKey)
  if (existing) {
    getInventory(storage) // Finish any pending debit before reporting success.
    try { clearCart(storage); return { order: existing, warning: '' } }
    catch { return { order: existing, warning: 'El pedido ya estaba confirmado, pero no se pudo vaciar el carrito. No se descontó inventario nuevamente.' } }
  }
  const inventoryBefore = getInventory(storage)
  validateStock(items, inventoryBefore, available)
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
    statusHistory: [{ status: 'Pagado', at: date.toISOString() }],
    checkoutKey,
  }
  try { storage.setItem(INVENTORY_PENDING_KEY, JSON.stringify({ orderId: order.id })) }
  catch { throw new Error('No se pudo preparar el descuento de inventario. El pedido no se creó y el carrito permanece intacto.') }
  try { saveOrders([...previous, order], storage) }
  catch (error) {
    try { storage.removeItem(INVENTORY_PENDING_KEY) } catch { /* A later read can clear an orphan marker. */ }
    throw error
  }
  try {
    applyOrderInventory(order, storage)
  } catch (error) {
    throw new Error(`El pedido quedó guardado, pero el descuento de inventario está pendiente. No confirmes otro pedido; libera espacio y vuelve a abrir el carrito o seguimiento para conciliarlo. ${error.message}`)
  }
  let pendingWarning = ''
  try { storage.removeItem(INVENTORY_PENDING_KEY) }
  catch { pendingWarning = ' El descuento se registró, pero no se pudo cerrar el marcador de recuperación; se conciliará al volver a acceder al inventario.' }
  try {
    clearCart(storage)
    return { order, warning: pendingWarning }
  } catch {
    // The order is already saved: never submit it a second time to retry clearing the cart.
    return { order, warning: `El pedido quedó confirmado, pero no se pudo vaciar el carrito. Revisa el almacenamiento del navegador antes de crear otro pedido.${pendingWarning}` }
  }
}
