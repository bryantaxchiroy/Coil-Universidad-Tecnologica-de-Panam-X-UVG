import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { addCartItem } from '../src/data/cartStorage.js'
import { createOrder, filterOrders, findOrder, getOrders, nextOrderStatus, orderIndicators, orderStages, ORDERS_STORAGE_KEY, subscribeOrders, updateOrderStatus } from '../src/data/orderStorage.js'

function memoryStorage() {
  const data = new Map()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) }
}

const item = (id, quantity = 2) => ({ id, productId: 'pulso-urbano', name: 'Pulso urbano', size: 'M', color: 'Negro', price: 26.99, quantity, elements: [
  { id: 'text', type: 'text', content: 'Mi equipo', x: 300, y: 300, width: 100, height: 35, rotation: 0, color: '#fff', font: 'Georgia' },
  { id: 'image', type: 'image', content: 'data:image/png;base64,AAAA', name: 'logo.png', x: 300, y: 390, width: 60, height: 60, rotation: 30 },
] })
const details = (method = 'retiro') => ({ customer: { fullName: 'Ana Pérez', email: 'ana@example.com', phone: '61234567' }, delivery: { method, address: method === 'envio' ? 'Avenida Central 123' : '' } })
function placeOrder(storage, method = 'retiro', time = '2026-11-20T10:00:00Z') {
  addCartItem(item(`camiseta-${time}`), storage)
  return createOrder(details(method), storage, { idFactory: () => '12345678-aaaa', now: () => new Date(time) }).order
}

test('indicadores y listado provienen de pedidos almacenados y filtros por estado e identificador', () => {
  const storage = memoryStorage()
  const first = placeOrder(storage)
  const second = placeOrder(storage, 'envio', '2026-11-21T10:00:00Z')
  updateOrderStatus(first.id, 'En cola', storage)
  updateOrderStatus(first.id, 'En impresión', storage)
  for (const state of orderStages('envio').slice(1)) updateOrderStatus(second.id, state, storage)
  const orders = getOrders(storage)
  assert.deepEqual(orderIndicators(orders), { total: 2, paid: 0, production: 1, completed: 1, revenue: 107.96 })
  assert.deepEqual(filterOrders(orders).map(({ id }) => id), [second.id, first.id])
  assert.deepEqual(filterOrders(orders, { query: first.id.toLowerCase().slice(-8), status: 'En impresión' }).map(({ id }) => id), [first.id])
  assert.deepEqual(filterOrders(orders, { status: 'Pagado' }), [])
  assert.deepEqual(orderIndicators([]), { total: 0, paid: 0, production: 0, completed: 0, revenue: 0 })
})

test('detalles y personalizaciones originales se conservan tras la actualización y seguimiento lee el nuevo estado', () => {
  const storage = memoryStorage()
  const original = placeOrder(storage, 'envio')
  assert.equal(nextOrderStatus(original), 'En cola')
  const updated = updateOrderStatus(original.id.toLowerCase(), 'En cola', storage, { now: () => new Date('2026-11-20T11:00:00Z') })
  assert.equal(updated.statusHistory[1].at, '2026-11-20T11:00:00.000Z')
  const tracked = findOrder(original.id, storage)
  assert.equal(tracked.status, 'En cola')
  assert.equal(tracked.customer.fullName, 'Ana Pérez')
  assert.equal(tracked.delivery.address, 'Avenida Central 123')
  assert.equal(tracked.items[0].quantity, 2)
  assert.equal(tracked.items[0].price, 26.99)
  assert.deepEqual(tracked.items[0].elements, original.items[0].elements)
  assert.equal(tracked.total, 53.98)
  assert.equal(getOrders(storage)[0].statusHistory.length, 2)
})

test('se rechazan saltos, retrocesos, estados de otra entrega y cambios después de Entregado sin sobrescribir', () => {
  const storage = memoryStorage()
  const original = placeOrder(storage)
  const before = storage.getItem(ORDERS_STORAGE_KEY)
  for (const status of ['Entregado', 'En impresión', 'Pagado', 'En camino']) {
    assert.throws(() => updateOrderStatus(original.id, status, storage), /Transición no permitida/)
    assert.equal(storage.getItem(ORDERS_STORAGE_KEY), before)
  }
  assert.throws(() => updateOrderStatus('desconocido', 'En cola', storage), /ya no existe/)
  for (const status of orderStages('retiro').slice(1)) updateOrderStatus(original.id, status, storage)
  assert.equal(findOrder(original.id, storage).status, 'Entregado')
  assert.equal(findOrder(original.id, storage).statusHistory.length, 5)
  assert.equal(nextOrderStatus(findOrder(original.id, storage)), null)
  assert.throws(() => updateOrderStatus(original.id, 'Entregado', storage), /Transición no permitida/)
})

test('los pedidos antiguos sin historial pueden avanzar y se conserva su fecha inicial', () => {
  const storage = memoryStorage()
  const order = placeOrder(storage)
  storage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([{ ...order, statusHistory: undefined }]))
  const changed = updateOrderStatus(order.id, 'En cola', storage)
  assert.deepEqual(changed.statusHistory[0], { status: 'Pagado', at: order.createdAt })
  assert.equal(changed.statusHistory.length, 2)
})

test('los avisos notifican a la misma pestaña y a otras pestañas solo después de guardar', () => {
  const storage = memoryStorage()
  const oldWindow = globalThis.window
  const fakeWindow = new EventTarget()
  globalThis.window = fakeWindow
  try {
    let changes = 0
    const unsubscribe = subscribeOrders(() => { changes += 1 })
    const order = placeOrder(storage)
    assert.equal(changes, 1)
    updateOrderStatus(order.id, 'En cola', storage)
    assert.equal(changes, 2)
    const event = new Event('storage')
    Object.defineProperty(event, 'key', { value: ORDERS_STORAGE_KEY })
    fakeWindow.dispatchEvent(event)
    assert.equal(changes, 3)
    const before = storage.getItem(ORDERS_STORAGE_KEY)
    const unavailable = { ...storage, setItem: () => { const error = new Error('quota'); error.name = 'QuotaExceededError'; throw error } }
    assert.throws(() => updateOrderStatus(order.id, 'En impresión', unavailable), /espacio suficiente/)
    assert.equal(storage.getItem(ORDERS_STORAGE_KEY), before)
    assert.equal(changes, 3)
    unsubscribe()
  } finally {
    if (oldWindow === undefined) delete globalThis.window
    else globalThis.window = oldWindow
  }
})

test('el detalle de productos reutilizado muestra personalizaciones y precios unitarios', async () => {
  const storage = memoryStorage()
  const order = placeOrder(storage)
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  try {
    const { default: OrderItems } = await vite.ssrLoadModule('/src/components/OrderItems.jsx')
    const itemsHtml = renderToStaticMarkup(React.createElement(OrderItems, { items: order.items, showUnitPrice: true }))
    assert.match(itemsHtml, /Mi equipo/)
    assert.match(itemsHtml, /logo.png/)
    assert.match(itemsHtml, /Precio unitario/)
  } finally {
    await vite.close()
  }
})
