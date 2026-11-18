import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { addCartItem, cartTotals, cartUnitCount, changeCartQuantity, clearCart, DEFAULT_CART_QUANTITY, getCart, MAX_CART_QUANTITY, nextCartQuantity, removeCartItem, subscribeCart, validateCartQuantity } from '../src/data/cartStorage.js'
import { createOrder } from '../src/data/orderStorage.js'

function memoryStorage() {
  const data = new Map()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) }
}

const item = (id, quantity = 1) => ({ id, productId: 'pulso-urbano', name: 'Pulso urbano', price: 26.99, basePrice: 24.99, customizationPrice: 2, size: 'M', color: 'Negro', text: { content: 'Trama', color: '#ffffff', font: 'Outfit', x: 50, y: 30 }, image: null, quantity })

test('el botón de Inicio enlaza al carrito y presenta la suma de unidades', async () => {
  const home = await readFile(new URL('../src/pages/Home.jsx', import.meta.url), 'utf8')
  assert.match(home, /<Button to="\/carrito" variant="light">[^\n]*Ver mi carrito/)
  assert.match(home, /<ShoppingBag size=\{18\} \/>/)
  assert.match(home, /\{count\} unidades en el carrito/)
  const storage = memoryStorage()
  assert.equal(cartUnitCount(storage), 0)
  addCartItem(item('uno', 3), storage)
  addCartItem(item('dos', 2), storage)
  assert.equal(cartUnitCount(storage), 5)
  changeCartQuantity('dos', 4, storage)
  assert.equal(cartUnitCount(storage), 7)
  removeCartItem('uno', storage)
  assert.equal(cartUnitCount(storage), 4)
  clearCart(storage)
  assert.equal(cartUnitCount(storage), 0)
})

test('el contador recibe notificaciones después de agregar, editar, eliminar y vaciar', () => {
  const storage = memoryStorage()
  const previousWindow = globalThis.window
  const fakeWindow = new EventTarget()
  fakeWindow.localStorage = storage
  globalThis.window = fakeWindow
  try {
    const counts = []
    const unsubscribe = subscribeCart(() => counts.push(cartUnitCount()))
    addCartItem(item('uno', 3))
    changeCartQuantity('uno', 4)
    removeCartItem('uno')
    addCartItem(item('dos', 2))
    clearCart()
    assert.deepEqual(counts, [3, 4, 0, 2, 0])
    unsubscribe()
    addCartItem(item('tres'))
    assert.equal(counts.length, 5)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

test('el personalizador inicia en 1, aumenta/disminuye y valida los límites compartidos', () => {
  assert.equal(DEFAULT_CART_QUANTITY, 1)
  assert.equal(nextCartQuantity(DEFAULT_CART_QUANTITY, 1), 2)
  assert.equal(nextCartQuantity(2, -1), 1)
  assert.throws(() => nextCartQuantity(1, -1), /número entero entre 1 y 99/)
  assert.throws(() => nextCartQuantity(MAX_CART_QUANTITY, 1), /número entero entre 1 y 99/)
  for (const invalid of [0, -1, 1.5, NaN, '3', Infinity]) assert.throws(() => validateCartQuantity(invalid), /número entero/)
  const storage = memoryStorage()
  assert.throws(() => addCartItem(item('inválido', 0), storage), /número entero/)
  assert.deepEqual(getCart(storage), [])
})

test('tres camisetas personalizadas conservan cantidad y precio hasta checkout', () => {
  const storage = memoryStorage()
  addCartItem(item('tres', 3), storage)
  assert.equal(getCart(storage)[0].quantity, 3)
  assert.deepEqual(cartTotals(getCart(storage)), { subtotal: 80.97, total: 80.97, count: 3 })
  const { order } = createOrder({ customer: { fullName: 'Ana Pérez', email: 'ana@example.com', phone: '12345678' }, delivery: { method: 'retiro', address: '' } }, storage)
  assert.equal(order.items[0].quantity, 3)
  assert.equal(order.items[0].text.content, 'Trama')
  assert.equal(order.subtotal, 80.97)
  assert.equal(order.total, 80.97)
})
