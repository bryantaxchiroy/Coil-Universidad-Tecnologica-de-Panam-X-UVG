// Each entry is an independent configuration; price is its unit price including customization.
import { getInventory, validateStock } from './inventoryStorage.js'
import { getProducts } from './productStorage.js'
export const CART_STORAGE_KEY = 'trama-cart'
export const DEFAULT_CART_QUANTITY = 1
export const MAX_CART_QUANTITY = 99
const CART_CHANGE_EVENT = 'trama:cart-change'

export function validateCartQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
    throw new Error(`La cantidad debe ser un número entero entre 1 y ${MAX_CART_QUANTITY}.`)
  }
  return quantity
}

export function nextCartQuantity(quantity, delta) {
  return validateCartQuantity(quantity + delta)
}

export function subscribeCart(listener) {
  window.addEventListener(CART_CHANGE_EVENT, listener)
  const onStorage = (event) => {
    if (event.key === CART_STORAGE_KEY || event.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CART_CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function cartUnitCount(storage = window.localStorage) {
  return cartTotals(getCart(storage)).count
}

export function isCartItem(item) {
  return item && typeof item.id === 'string' && typeof item.productId === 'string' && typeof item.name === 'string' && typeof item.size === 'string' && typeof item.color === 'string' && Number.isFinite(item.price) && item.price >= 0 && Number.isInteger(item.quantity) && item.quantity > 0
}

export function storageError(error, action) {
  if (error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014) {
    return new Error('No queda espacio en el almacenamiento del navegador para guardar este artículo. Prueba con una imagen más pequeña o libera espacio e inténtalo de nuevo.')
  }
  return new Error(`No se pudo ${action}. Comprueba que el almacenamiento del navegador esté habilitado e inténtalo de nuevo.`)
}

export function getCart(storage = window.localStorage) {
  try {
    const saved = storage.getItem(CART_STORAGE_KEY)
    const items = saved === null ? [] : JSON.parse(saved)
    if (!Array.isArray(items) || !items.every(isCartItem)) throw new Error('invalid-cart')
    return items
  } catch {
    throw new Error('No se pudo leer el carrito guardado. Los datos podrían estar dañados o el almacenamiento no está disponible.')
  }
}

export function saveCart(items, storage = window.localStorage) {
  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    throw storageError(error, 'guardar el carrito')
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CART_CHANGE_EVENT))
  return items
}

export function addCartItem(item, storage = window.localStorage) {
  validateCartQuantity(item.quantity)
  const items = [...getCart(storage), item]
  validateStock(items, getInventory(storage), getProducts(storage))
  return saveCart(items, storage)
}

export function changeCartQuantity(id, quantity, storage = window.localStorage) {
  validateCartQuantity(quantity)
  const items = getCart(storage)
  if (!items.some((item) => item.id === id)) throw new Error('El artículo ya no está en el carrito.')
  const updated = items.map((item) => item.id === id ? { ...item, quantity } : item)
  validateStock(updated, getInventory(storage), getProducts(storage))
  return saveCart(updated, storage)
}

export function removeCartItem(id, storage = window.localStorage) {
  return saveCart(getCart(storage).filter((item) => item.id !== id), storage)
}

export function cartTotals(items) {
  const subtotal = Math.round(items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0)) / 100
  return { subtotal, total: subtotal, count: items.reduce((sum, item) => sum + item.quantity, 0) }
}

export function clearCart(storage = window.localStorage) {
  try {
    storage.removeItem(CART_STORAGE_KEY)
  } catch (error) {
    throw storageError(error, 'vaciar el carrito')
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CART_CHANGE_EVENT))
}
