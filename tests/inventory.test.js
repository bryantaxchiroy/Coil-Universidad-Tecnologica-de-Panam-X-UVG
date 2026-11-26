import test from 'node:test'
import assert from 'node:assert/strict'
import { addCartItem, CART_STORAGE_KEY, changeCartQuantity, getCart } from '../src/data/cartStorage.js'
import { createOrder, findOrder, getOrders, ORDERS_STORAGE_KEY } from '../src/data/orderStorage.js'
import { originalProductColors, products } from '../src/data/products.js'
import { getProducts, saveProduct, setProductActive } from '../src/data/productStorage.js'
import { DEMO_INITIAL_STOCK, getInventory, groupedVariants, INVENTORY_PENDING_KEY, INVENTORY_STORAGE_KEY, inventoryIndicators, LOW_STOCK_THRESHOLD, setProductInitialStock, setVariantStock, stockFor, validateStock, variantKey } from '../src/data/inventoryStorage.js'

function storage() {
  const data = new Map()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) }
}
const item = (id, quantity = 1, color = 'Negro', size = 'M', productId = 'pulso-urbano') => ({ id, productId, name: 'Pulso urbano', size, color, price: 24.99, quantity })
const details = { customer: { fullName: 'Ana Test', email: 'ana@example.com', phone: '61234567' }, delivery: { method: 'retiro', address: '' } }
const order = (store, now = '2026-11-20T10:00:00Z') => createOrder(details, store, { idFactory: () => '12345678', now: () => new Date(now) }).order

test('inicializa demo sin escribir y resta pedidos previos al inventario por variante', () => {
  const s = storage()
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M'), DEMO_INITIAL_STOCK)
  assert.equal(s.getItem(INVENTORY_STORAGE_KEY), null)
  s.setItem(ORDERS_STORAGE_KEY, JSON.stringify([{ id: 'TRM-LEGACY', createdAt: '2026-11-18T12:00:00Z', items: [item('old', 3)], total: 74.97, status: 'Pagado', delivery: { method: 'retiro', address: '' } }]))
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M'), DEMO_INITIAL_STOCK - 3)
  assert.deepEqual(getInventory(s).appliedOrders, ['TRM-LEGACY'])
})

test('editar stock por talla/color persiste sin alterar otras variantes ni reponerse al recargar', () => {
  const s = storage()
  setVariantStock('pulso-urbano', 'Negro', 'M', 7, s)
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M'), 7)
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Blanco', 'M'), DEMO_INITIAL_STOCK)
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'S'), DEMO_INITIAL_STOCK)
  assert.throws(() => setVariantStock('pulso-urbano', 'Negro', 'M', -1, s), /entero/)
  assert.throws(() => setVariantStock('pulso-urbano', 'Negro', 'M', 1.5, s), /entero/)
})

test('agotados y stock bajo calculan indicadores reales incluso para productos inactivos', () => {
  const s = storage()
  setVariantStock('pulso-urbano', 'Negro', 'M', 0, s)
  setVariantStock('pulso-urbano', 'Blanco', 'M', LOW_STOCK_THRESHOLD, s)
  setProductActive('pulso-urbano', false, s)
  const catalog = getProducts(s)
  const stats = inventoryIndicators(catalog, getInventory(s))
  assert.equal(stats.soldOut, 13)
  assert.equal(stats.low, 1)
  assert.equal(stats.activeProducts, products.length - 1)
  assert.equal(stats.available, products.reduce((sum, product) => sum + originalProductColors[product.id].length * product.sizes.length * DEMO_INITIAL_STOCK, 0) - 40 + LOW_STOCK_THRESHOLD)
})

test('colores fotográficos nuevos inician agotados sin cambiar variantes anteriores y se pueden reponer', () => {
  const s = storage()
  const variants = [
    ['linea-libre', 'Blanco', 'Crema'],
    ['fuera-de-serie', 'Beige', 'Azul marino'],
    ['modo-creativo', 'Gris', 'Terracota'],
  ]
  setVariantStock('linea-libre', 'Crema', 'M', 7, s)
  for (const [id, color, oldColor] of variants) {
    for (const size of ['S', 'M', 'L', 'XL']) {
      assert.equal(getProducts(s).find((product) => product.id === id).colors.includes(color), true)
      assert.equal(stockFor(getInventory(s), id, color, size), 0)
      assert.throws(() => addCartItem(item(`${id}-${size}`, 1, color, size, id), s), /Stock insuficiente/)
    }
    assert.equal(stockFor(getInventory(s), id, oldColor, 'M'), id === 'linea-libre' ? 7 : DEMO_INITIAL_STOCK)
  }
  setVariantStock('linea-libre', 'Blanco', 'M', 2, s)
  addCartItem(item('blanco', 1, 'Blanco', 'M', 'linea-libre'), s)
  const confirmed = order(s)
  assert.equal(findOrder(confirmed.id, s).items[0].color, 'Blanco')
  assert.equal(stockFor(getInventory(s), 'linea-libre', 'Blanco', 'M'), 1)
  assert.equal(stockFor(getInventory(s), 'linea-libre', 'Crema', 'M'), 7)
  assert.equal(getInventory(s).appliedOrders.filter((id) => id === confirmed.id).length, 1)
  assert.equal(stockFor(getInventory(s), 'linea-libre', 'Blanco', 'M'), 1)
})

test('inventario sin guardar inicia nuevos colores en cero sin escribir ni reponer pedidos antiguos', () => {
  const s = storage()
  assert.equal(stockFor(getInventory(s), 'fuera-de-serie', 'Beige', 'S'), 0)
  assert.equal(stockFor(getInventory(s), 'modo-creativo', 'Gris', 'XL'), 0)
  assert.equal(stockFor(getInventory(s), 'fuera-de-serie', 'Azul marino', 'S'), DEMO_INITIAL_STOCK)
  assert.equal(s.getItem(INVENTORY_STORAGE_KEY), null)
})

test('carrito suma diseños repetidos y admite exactamente el stock disponible', () => {
  const s = storage()
  setVariantStock('pulso-urbano', 'Negro', 'M', 5, s)
  addCartItem(item('one', 2), s)
  addCartItem(item('two', 3), s)
  assert.equal(groupedVariants(getCart(s)).get(variantKey('pulso-urbano', 'Negro', 'M')), 5)
  assert.throws(() => addCartItem(item('three', 1), s), /Stock insuficiente/)
  assert.throws(() => changeCartQuantity('one', 3, s), /Stock insuficiente/)
  assert.equal(getCart(s).length, 2)
  assert.equal(changeCartQuantity('two', 2, s)[1].quantity, 2)
})

test('checkout descuenta una sola vez todas las variantes agrupadas', () => {
  const s = storage()
  setVariantStock('pulso-urbano', 'Negro', 'M', 6, s)
  addCartItem(item('a', 2), s); addCartItem(item('b', 3), s)
  addCartItem(item('c', 1, 'Blanco'), s)
  const created = order(s)
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M'), 1)
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Blanco', 'M'), DEMO_INITIAL_STOCK - 1)
  assert.equal(getInventory(s).appliedOrders.filter((id) => id === created.id).length, 1)
  assert.deepEqual(getCart(s), [])
  assert.equal(findOrder(created.id, s).items.length, 3)
})

test('checkout vuelve a validar stock, variantes y disponibilidad sin modificar pedido ni carrito', () => {
  const s = storage()
  addCartItem(item('a', 2), s)
  setVariantStock('pulso-urbano', 'Negro', 'M', 1, s)
  assert.throws(() => order(s), /Stock insuficiente.*Negro.*M/)
  assert.equal(getOrders(s).length, 0)
  assert.equal(getCart(s).length, 1)
  setVariantStock('pulso-urbano', 'Negro', 'M', 4, s)
  saveProduct({ ...products[0], editing: true, sizes: ['S', 'L', 'XL'], active: true }, s)
  assert.throws(() => order(s), /variante.*ya no existe/)
  saveProduct({ ...products[0], editing: true, active: false }, s)
  assert.throws(() => order(s), /no está disponible/)
})

test('pedidos anteriores sin marcador no se descuentan dos veces al inicializar', () => {
  const s = storage()
  s.setItem(ORDERS_STORAGE_KEY, JSON.stringify([{ id: 'TRM-OLD', createdAt: '2026-11-18T10:00:00Z', items: [item('a', 2)], total: 49.98, status: 'Pagado', delivery: { method: 'retiro', address: '' } }]))
  setVariantStock('pulso-urbano', 'Blanco', 'S', 5, s)
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M'), DEMO_INITIAL_STOCK - 2)
  assert.equal(getInventory(s).appliedOrders.filter((id) => id === 'TRM-OLD').length, 1)
})

test('reintento con el mismo carrito devuelve pedido existente y no vuelve a descontar', () => {
  const s = storage()
  addCartItem(item('a', 2), s)
  const blocked = { ...s, removeItem: (key) => { if (key === CART_STORAGE_KEY) throw new Error('blocked'); s.removeItem(key) } }
  const first = order(blocked)
  assert.equal(getCart(s).length, 1)
  const after = stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M')
  const again = order(s, '2026-11-21T10:00:00Z')
  assert.equal(again.id, first.id)
  assert.equal(getOrders(s).length, 1)
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M'), after)
})

test('fallo al guardar inventario después de guardar pedido deja marcador y se concilia sin duplicar', () => {
  const s = storage()
  setVariantStock('pulso-urbano', 'Negro', 'M', 5, s)
  addCartItem(item('a', 2), s)
  const blocked = { ...s, setItem: (key, value) => {
    if (key === INVENTORY_STORAGE_KEY) throw new Error('write denied')
    s.setItem(key, value)
  } }
  assert.throws(() => order(blocked), /descuento de inventario está pendiente/)
  assert.equal(getOrders(s).length, 1)
  assert.equal(getCart(s).length, 1)
  assert.ok(s.getItem(INVENTORY_PENDING_KEY))
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M'), 3)
  assert.equal(s.getItem(INVENTORY_PENDING_KEY), null)
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M'), 3)
  assert.equal(order(s).id, getOrders(s)[0].id)
})

test('fallo de pedido antes de guardarlo no cambia el stock y conserva el carrito', () => {
  const s = storage()
  addCartItem(item('a'), s)
  const blocked = { ...s, setItem: (key, value) => {
    if (key === ORDERS_STORAGE_KEY) throw new Error('denied')
    s.setItem(key, value)
  } }
  assert.throws(() => order(blocked), /carrito permanece intacto/)
  assert.equal(getOrders(s).length, 0)
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M'), DEMO_INITIAL_STOCK)
  assert.equal(getCart(s).length, 1)
})

test('inventario corrupto o fallo de cuota no se sobrescribe', () => {
  const s = storage()
  s.setItem(INVENTORY_STORAGE_KEY, '{broken')
  assert.throws(() => getInventory(s), /datos podrían estar dañados/)
  assert.throws(() => setVariantStock('pulso-urbano', 'Negro', 'M', 1, s), /datos podrían estar dañados/)
  s.removeItem(INVENTORY_STORAGE_KEY)
  const blocked = { ...s, setItem: (key, value) => { if (key === INVENTORY_STORAGE_KEY) { const error = new Error('quota'); error.name = 'QuotaExceededError'; throw error } s.setItem(key, value) } }
  assert.throws(() => setVariantStock('pulso-urbano', 'Negro', 'M', 1, blocked), /No hay espacio/)
  assert.equal(s.getItem(INVENTORY_STORAGE_KEY), null)
})

test('productos nuevos arrancan en cero, admiten stock inicial y nuevas variantes no reponen las anteriores', () => {
  const s = storage()
  const product = saveProduct({ id: 'prod-new', name: 'Nueva', description: 'Prueba', price: 20, category: 'Nuevas', colors: ['Negro'], sizes: ['M'], image: products[0].image, active: true }, s)
  assert.equal(stockFor(getInventory(s), product.id, 'Negro', 'M'), 0)
  assert.throws(() => addCartItem(item('new', 1, 'Negro', 'M', product.id), s), /Stock insuficiente/)
  setProductInitialStock(product.id, 4, s)
  saveProduct({ ...product, colors: ['Negro', 'Blanco'], editing: true }, s)
  assert.equal(stockFor(getInventory(s), product.id, 'Negro', 'M'), 4)
  assert.equal(stockFor(getInventory(s), product.id, 'Blanco', 'M'), 0)
  setVariantStock(product.id, 'Blanco', 'M', 2, s)
  assert.equal(stockFor(getInventory(s), product.id, 'Negro', 'M'), 4)
})

test('stock antiguo de variantes retiradas permanece guardado, pero no se puede comprar', () => {
  const s = storage()
  setVariantStock('pulso-urbano', 'Negro', 'M', 9, s)
  saveProduct({ ...products[0], colors: ['Blanco'], editing: true, active: true }, s)
  assert.equal(stockFor(getInventory(s), 'pulso-urbano', 'Negro', 'M'), 9)
  assert.throws(() => addCartItem(item('a'), s), /variante.*ya no existe/)
})
