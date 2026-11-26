import { originalProductColors, products } from './products.js'
import { getProducts } from './productStorage.js'
import { getOrders } from './orderStorage.js'

export const INVENTORY_STORAGE_KEY = 'trama-inventory'
export const INVENTORY_PENDING_KEY = 'trama-inventory-pending'
export const INVENTORY_CHANGE_EVENT = 'trama:inventory-change'
export const LOW_STOCK_THRESHOLD = 3
// Explicit demo baseline for original products only. Newly added variants start at zero.
export const DEMO_INITIAL_STOCK = 20
export const variantKey = (productId, color, size) => JSON.stringify([productId, color, size])
export const groupedVariants = (items) => {
  const grouped = new Map()
  for (const item of items) {
    const key = variantKey(item.productId, item.color, item.size)
    grouped.set(key, (grouped.get(key) || 0) + item.quantity)
  }
  return grouped
}

export function subscribeInventory(listener) {
  window.addEventListener(INVENTORY_CHANGE_EVENT, listener)
  const onStorage = (event) => {
    if (event.key === INVENTORY_STORAGE_KEY || event.key === INVENTORY_PENDING_KEY || event.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => { window.removeEventListener(INVENTORY_CHANGE_EVENT, listener); window.removeEventListener('storage', onStorage) }
}

function readStored(storage) {
  try {
    const raw = storage.getItem(INVENTORY_STORAGE_KEY)
    if (raw === null) return null
    const value = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value) || !value.stock || typeof value.stock !== 'object' || Array.isArray(value.stock) ||
      !Object.entries(value.stock).every(([key, amount]) => {
        try { const parts = JSON.parse(key); return Array.isArray(parts) && parts.length === 3 && parts.every((part) => typeof part === 'string' && part.length > 0) && Number.isSafeInteger(amount) && amount >= 0 } catch { return false }
      }) || !Array.isArray(value.appliedOrders) || !value.appliedOrders.every((id) => typeof id === 'string') || new Set(value.appliedOrders).size !== value.appliedOrders.length) throw new Error('invalid')
    return value
  } catch {
    throw new Error('No se pudo leer el inventario. Los datos podrían estar dañados o el almacenamiento no está disponible.')
  }
}

export function saveInventory(inventory, storage = window.localStorage) {
  try { storage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory)) }
  catch (error) {
    if (error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014) throw new Error('No hay espacio para guardar el inventario. Libera espacio y vuelve a intentar; no se sobrescribieron las existencias.')
    throw new Error('No se pudo guardar el inventario. Comprueba el almacenamiento del navegador.')
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(INVENTORY_CHANGE_EVENT))
  return inventory
}

function initialInventory(storage) {
  const stock = Object.fromEntries(products.flatMap((product) => product.colors.flatMap((color) => product.sizes.map((size) =>
    [variantKey(product.id, color, size), originalProductColors[product.id].includes(color) ? DEMO_INITIAL_STOCK : 0]
  ))))
  const orders = getOrders(storage)
  for (const order of orders) for (const [key, amount] of groupedVariants(order.items)) {
    if (Object.hasOwn(stock, key)) stock[key] = Math.max(0, stock[key] - amount)
  }
  return { stock, appliedOrders: orders.map((order) => order.id) }
}

// A pending marker means an order was being written when the tab closed or
// storage failed. The order is authoritative; the ledger prevents a second debit.
export function getInventory(storage = window.localStorage) {
  let inventory = readStored(storage) || initialInventory(storage)
  let pending
  try {
    const raw = storage.getItem(INVENTORY_PENDING_KEY)
    pending = raw === null ? null : JSON.parse(raw)
    if (pending && (typeof pending.orderId !== 'string' || !pending.orderId)) throw new Error('invalid')
  } catch { throw new Error('Hay una operación de inventario pendiente dañada; no se modificaron las existencias.') }
  if (pending) {
    const order = getOrders(storage).find((entry) => entry.id === pending.orderId)
    if (order && !inventory.appliedOrders.includes(order.id)) {
      inventory = applyOrderInventory(order, storage)
    }
    try { storage.removeItem(INVENTORY_PENDING_KEY) }
    catch { throw new Error('No se pudo cerrar la operación pendiente de inventario. Vuelve a intentar.') }
  }
  return inventory
}

export function applyOrderInventory(order, storage = window.localStorage) {
  // Re-read the ledger immediately before debit: another tab may have
  // reconciled the pending operation after the order was written.
  const inventory = readStored(storage) || initialInventory(storage)
  if (inventory.appliedOrders.includes(order.id)) return inventory
  const stock = { ...inventory.stock }
  for (const [key, amount] of groupedVariants(order.items)) {
    if (!Object.hasOwn(stock, key) || stock[key] < amount) throw new Error(`No se puede conciliar el pedido ${order.id}: faltan existencias para ${key}. Revisa el inventario antes de continuar.`)
    stock[key] -= amount
  }
  return saveInventory({ stock, appliedOrders: [...inventory.appliedOrders, order.id] }, storage)
}

export function stockFor(inventory, productId, color, size) {
  return inventory.stock[variantKey(productId, color, size)] ?? 0
}

export function validateStock(items, inventory, catalog) {
  for (const [key, amount] of groupedVariants(items)) {
    const [id, color, size] = JSON.parse(key)
    const product = catalog.find((entry) => entry.id === id)
    if (!product || product.active === false) throw new Error(`La camiseta ${product?.name || id} ya no está disponible.`)
    if (!product.colors.includes(color) || !product.sizes.includes(size)) throw new Error(`La variante ${product.name} · ${color} · ${size} ya no existe.`)
    const available = stockFor(inventory, id, color, size)
    if (amount > available) throw new Error(`Stock insuficiente para ${product.name} · ${color} · ${size}: quedan ${available} unidades y se solicitan ${amount}.`)
  }
}

export function setVariantStock(id, color, size, amount, storage = window.localStorage) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Las existencias deben ser un número entero igual o mayor que cero.')
  const product = getProducts(storage).find((entry) => entry.id === id)
  if (!product || !product.colors.includes(color) || !product.sizes.includes(size)) throw new Error('La variante ya no existe en este producto.')
  const inventory = getInventory(storage)
  return saveInventory({ ...inventory, stock: { ...inventory.stock, [variantKey(id, color, size)]: amount } }, storage)
}

export function setProductInitialStock(id, amount, storage = window.localStorage) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('El stock inicial debe ser un entero no negativo.')
  const product = getProducts(storage).find((entry) => entry.id === id)
  if (!product) throw new Error('Producto no encontrado.')
  const inventory = getInventory(storage)
  const stock = { ...inventory.stock }
  for (const color of product.colors) for (const size of product.sizes) stock[variantKey(id, color, size)] = amount
  return saveInventory({ ...inventory, stock }, storage)
}

export function inventoryIndicators(catalog, inventory) {
  const variants = catalog.flatMap((product) => product.colors.flatMap((color) => product.sizes.map((size) => stockFor(inventory, product.id, color, size))))
  return { available: variants.reduce((sum, amount) => sum + amount, 0), soldOut: variants.filter((amount) => amount === 0).length, low: variants.filter((amount) => amount > 0 && amount <= LOW_STOCK_THRESHOLD).length, activeProducts: catalog.filter((product) => product.active !== false).length }
}
