import test from 'node:test'
import assert from 'node:assert/strict'
import { addCartItem, CART_STORAGE_KEY, cartTotals, changeCartQuantity, getCart, removeCartItem } from '../src/data/cartStorage.js'
import { createOrder, findOrder, getOrders, ORDERS_STORAGE_KEY, orderStages, validateCheckout } from '../src/data/orderStorage.js'

function memoryStorage() {
  const data = new Map()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
}

const item = (id, price = 24.99) => ({ id, productId: 'pulso-urbano', name: 'Pulso urbano', price, size: 'M', color: 'Negro', text: { content: 'Original', color: '#ffffff', font: 'Outfit', x: 50, y: 30 }, image: { name: 'logo.png', dataUrl: 'data:image/png;base64,AAAA', x: 50, y: 65, size: 45 }, quantity: 1 })
const details = { customer: { fullName: ' Ada Test ', email: 'ada@example.com', phone: '6123-4567' }, delivery: { method: 'envio', address: ' Avenida Central 123 ' } }

test('agregar, cambiar cantidades y eliminar conserva cada personalización independiente', () => {
  const storage = memoryStorage()
  addCartItem(item('a'), storage)
  addCartItem({ ...item('b'), color: 'Blanco', text: { content: 'Otra' }, image: null }, storage)
  assert.equal(getCart(storage).length, 2)
  changeCartQuantity('a', 3, storage)
  assert.equal(getCart(storage)[0].quantity, 3)
  assert.equal(getCart(storage)[1].quantity, 1)
  assert.equal(getCart(storage)[1].text.content, 'Otra')
  assert.throws(() => changeCartQuantity('a', 0, storage), /cantidad/)
  removeCartItem('a', storage)
  assert.deepEqual(getCart(storage).map(({ id }) => id), ['b'])
})

test('subtotal y total se calculan en centavos con precio unitario y cantidad', () => {
  assert.deepEqual(cartTotals([{ ...item('a', 24.99), quantity: 2 }, item('b', 22.99)]), { subtotal: 72.97, total: 72.97, count: 3 })
  assert.deepEqual(cartTotals([]), { subtotal: 0, total: 0, count: 0 })
})

test('pedido simulado se guarda con imagen y estado Pagado antes de vaciar el carrito', () => {
  const storage = memoryStorage()
  addCartItem(item('a'), storage)
  const created = createOrder(details, storage, { idFactory: () => '12345678-aaaa-4444', now: () => new Date('2026-11-12T15:00:00Z') })
  assert.equal(created.warning, '')
  assert.match(created.order.id, /^TRM-[A-Z0-9]+-12345678$/)
  assert.equal(created.order.status, 'Pagado')
  assert.equal(created.order.items[0].image.dataUrl, item('a').image.dataUrl)
  assert.equal(created.order.delivery.address, 'Avenida Central 123')
  assert.equal(created.order.total, 24.99)
  assert.deepEqual(getCart(storage), [])
  assert.equal(findOrder(created.order.id.toLowerCase(), storage).id, created.order.id)
  assert.equal(findOrder('TRM-INEXISTENTE', storage), null)
  assert.equal(getOrders(storage).length, 1)
  addCartItem(item('b'), storage)
  createOrder({ ...details, delivery: { method: 'retiro', address: '' } }, storage)
  assert.equal(getOrders(storage).length, 2)
  assert.equal(getOrders(storage)[0].items[0].id, 'a')
  assert.deepEqual(orderStages('retiro'), ['Pagado', 'En cola', 'En impresión', 'Listo para retirar', 'Entregado'])
  assert.deepEqual(orderStages('envio'), ['Pagado', 'En cola', 'En impresión', 'En camino', 'Entregado'])
})

test('validaciones de checkout y error de cuota conservan el carrito sin crear un pedido', () => {
  const storage = memoryStorage()
  assert.deepEqual(Object.keys(validateCheckout({ customer: { fullName: '', email: 'bad', phone: '12' }, delivery: { method: 'envio', address: '' } })), ['fullName', 'email', 'phone', 'address'])
  addCartItem(item('a'), storage)
  const limitedStorage = { ...storage, setItem: (key, value) => { if (key === ORDERS_STORAGE_KEY) { const error = new Error('quota'); error.name = 'QuotaExceededError'; throw error } storage.setItem(key, value) } }
  assert.throws(() => createOrder(details, limitedStorage), /carrito permanece intacto/)
  assert.equal(getCart(storage).length, 1)
  assert.deepEqual(getOrders(storage), [])
  assert.throws(() => createOrder(details, memoryStorage()), /carrito está vacío/)
})

test('checkout rechaza un carrito cambiado en otra pestaña sin crear pedido ni descontar inventario', () => {
  const storage = memoryStorage()
  addCartItem(item('a'), storage)
  const displayed = getCart(storage)
  changeCartQuantity('a', 2, storage)
  assert.throws(() => createOrder(details, storage, { expectedItems: displayed }), /carrito cambió/)
  assert.deepEqual(getOrders(storage), [])
  assert.equal(getCart(storage)[0].quantity, 2)
  assert.equal(storage.getItem('trama-inventory'), null)
  assert.equal(storage.getItem('trama-inventory-pending'), null)
})

test('si falla el vaciado después de guardar, se informa el pedido ya creado', () => {
  const storage = memoryStorage()
  addCartItem(item('a'), storage)
  const blocked = { ...storage, removeItem: () => { throw new Error('denegado') } }
  const { order, warning } = createOrder(details, blocked)
  assert.match(warning, /pedido quedó confirmado/)
  assert.equal(findOrder(order.id, storage).status, 'Pagado')
  assert.equal(getCart(storage).length, 1)
})

test('datos dañados no se sobrescriben ni se tratan como pedidos inexistentes', () => {
  const storage = memoryStorage()
  storage.setItem(CART_STORAGE_KEY, '{roto')
  assert.throws(() => getCart(storage), /datos podrían estar dañados/)
  assert.throws(() => addCartItem(item('a'), storage), /datos podrían estar dañados/)
  assert.equal(storage.getItem(CART_STORAGE_KEY), '{roto')
  storage.setItem(ORDERS_STORAGE_KEY, '{roto')
  assert.throws(() => findOrder('trm-x', storage), /datos podrían estar dañados/)
  assert.equal(storage.getItem(ORDERS_STORAGE_KEY), '{roto')
  storage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([{ id: 'TRM-X', createdAt: '2026-11-12T15:00:00Z', items: [null], total: 1, status: 'Pagado', delivery: { method: 'envio', address: 'Calle' } }]))
  assert.throws(() => findOrder('TRM-X', storage), /datos podrían estar dañados/)
})
