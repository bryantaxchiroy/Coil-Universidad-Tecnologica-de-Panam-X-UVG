import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { products, legacyProductImages, filterProducts } from '../src/data/products.js'
import { PRODUCTS_STORAGE_KEY, getActiveProduct, getProducts, publicProducts, saveProduct, setProductActive, subscribeProducts } from '../src/data/productStorage.js'
import { addCartItem, getCart } from '../src/data/cartStorage.js'
import { createOrder, findOrder } from '../src/data/orderStorage.js'
import { setProductInitialStock } from '../src/data/inventoryStorage.js'

function memoryStorage() {
  const data = new Map()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) }
}
const draft = (id = 'prod-prueba') => ({
  id, name: 'Camiseta nueva', description: 'Una prenda de prueba', price: 28.5,
  category: 'Edición especial', colors: ['Negro', 'Blanco'], sizes: ['M', 'L'],
  image: products[0].image, active: true,
})
const cartItem = (product) => ({
  id: 'articulo-1', productId: product.id, productSnapshot: { ...product },
  name: product.name, size: 'M', color: 'Negro', price: product.price, quantity: 1,
  elements: [{ id: 'texto-1', type: 'text', content: 'Original', x: 300, y: 300, width: 100, height: 40, rotation: 0 }],
})
const details = { customer: { fullName: 'Cliente de prueba', email: 'demo@example.com', phone: '61234567' }, delivery: { method: 'retiro', address: '' } }

test('las cuatro imágenes comerciales existen y las rutas conservan la base pública', () => {
  const filenames = ['Pulso Urbano.jpeg', 'Línea Libre.jpeg', 'Fuera de Serie.jpeg', 'Modo Creativo.jpeg']
  for (const [index, product] of products.entries()) {
    assert.equal(product.image.endsWith(`/images/nuevas/${encodeURIComponent(filenames[index])}`), true)
    assert.equal(product.image.startsWith(import.meta.env?.BASE_URL || '/'), true)
    const bytes = readFileSync(new URL(`../public/images/nuevas/${encodeURIComponent(filenames[index])}`, import.meta.url))
    assert.equal(bytes[0], 0xff)
    assert.equal(bytes[1], 0xd8)
    assert.equal(bytes[bytes.length - 2], 0xff)
    assert.equal(bytes[bytes.length - 1], 0xd9)
    const old = readFileSync(new URL(`../public${legacyProductImages[product.id]}`, import.meta.url), 'utf8')
    assert.match(old, /<svg/)
  }
  assert.deepEqual(getProducts(memoryStorage()).map(({ image }) => image), products.map(({ image }) => image))
})

test('solo migran imágenes predeterminadas anteriores de los productos iniciales sin alterar otros campos', () => {
  const storage = memoryStorage()
  const old = { ...products[0], image: legacyProductImages[products[0].id], imageAlt: 'Imagen antigua', price: 42, name: 'Pulso editado', active: false }
  storage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify([old]))
  const saved = storage.getItem(PRODUCTS_STORAGE_KEY)
  const updated = getProducts(storage)[0]
  assert.equal(updated.image, products[0].image)
  assert.equal(updated.imageAlt, products[0].imageAlt)
  assert.equal(updated.name, 'Pulso editado')
  assert.equal(updated.price, 42)
  assert.equal(updated.active, false)
  assert.equal(getActiveProduct(old.id, storage), null)
  assert.equal(storage.getItem(PRODUCTS_STORAGE_KEY), saved)
  assert.equal(getProducts(storage)[0].image, products[0].image)
  setProductActive(old.id, true, storage)
  assert.equal(getProducts(storage)[0].image, products[0].image)
  assert.equal(getProducts(storage)[0].price, 42)
})

test('ediciones administrativas anteriores reciben el nuevo color sin sobrescribir imágenes ni desactivación', () => {
  const storage = memoryStorage()
  const old = { ...products[1], colors: ['Crema', 'Negro'], image: 'data:image/jpeg;base64,AAAA', price: 35, active: false }
  storage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify([old]))
  const before = storage.getItem(PRODUCTS_STORAGE_KEY)
  const updated = getProducts(storage).find(({ id }) => id === old.id)
  assert.deepEqual(updated.colors, ['Crema', 'Negro', 'Blanco'])
  assert.equal(updated.image, old.image)
  assert.equal(updated.active, false)
  assert.equal(updated.price, 35)
  assert.equal(storage.getItem(PRODUCTS_STORAGE_KEY), before)
  saveProduct({ ...updated, colors: ['Crema', 'Blanco'], editing: true }, storage)
  assert.deepEqual(getProducts(storage).find(({ id }) => id === old.id).colors, ['Crema', 'Blanco'])
  saveProduct({ ...getProducts(storage).find(({ id }) => id === old.id), colors: ['Crema'], editing: true }, storage)
  assert.deepEqual(getProducts(storage).find(({ id }) => id === old.id).colors, ['Crema'])
})

test('imágenes personalizadas y referencias antiguas de otros productos o pedidos no se sobrescriben', () => {
  const storage = memoryStorage()
  const customImage = 'data:image/jpeg;base64,AAAA'
  const custom = { ...products[1], image: customImage, active: false }
  const otherOld = { ...products[2], image: legacyProductImages[products[0].id], active: true }
  const created = { ...draft(), image: legacyProductImages[products[1].id] }
  storage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify([custom, otherOld, created]))
  const catalog = getProducts(storage)
  assert.equal(catalog.find(({ id }) => id === custom.id).image, customImage)
  assert.equal(catalog.find(({ id }) => id === custom.id).active, false)
  assert.equal(catalog.find(({ id }) => id === otherOld.id).image, otherOld.image)
  assert.equal(catalog.find(({ id }) => id === created.id).image, created.image)
  assert.equal(filterProducts(publicProducts(catalog), { search: 'Pulso urbano' })[0].image, products[0].image)
  const oldSnapshot = { ...cartItem(products[0]), productSnapshot: { ...products[0], image: legacyProductImages[products[0].id] } }
  addCartItem(oldSnapshot, storage)
  assert.equal(getCart(storage)[0].productSnapshot.image, legacyProductImages[products[0].id])
  const order = createOrder(details, storage).order
  assert.equal(findOrder(order.id, storage).items[0].productSnapshot.image, legacyProductImages[products[0].id])
  assert.equal(getProducts(storage).find(({ id }) => id === created.id).image, created.image)
})

test('crear producto y recuperar los productos iniciales más el nuevo tras recargar', () => {
  const storage = memoryStorage()
  const created = saveProduct(draft(), storage)
  assert.equal(created.id, 'prod-prueba')
  assert.equal(getProducts(storage).length, products.length + 1)
  assert.equal(getProducts(storage).find((item) => item.id === created.id).description, 'Una prenda de prueba')
  assert.equal(JSON.parse(storage.getItem(PRODUCTS_STORAGE_KEY)).length, 1)
  assert.equal(getProducts(memoryStorage()).length, products.length)
})

test('editar conserva el identificador y actualiza precio, imagen, opciones y filtros públicos', () => {
  const storage = memoryStorage()
  saveProduct(draft(), storage)
  const changed = saveProduct({ ...draft(), editing: true, name: 'Camiseta editada', price: 31, category: 'Minimalistas', colors: ['Crema'], sizes: ['S'], image: products[1].image }, storage)
  assert.equal(changed.id, 'prod-prueba')
  assert.equal(getProducts(storage).length, products.length + 1)
  assert.equal(getProducts(storage).find((item) => item.id === changed.id).price, 31)
  assert.equal(filterProducts(publicProducts(getProducts(storage)), { search: 'editada', category: 'Minimalistas', size: 'S', color: 'Crema' })[0].image, products[1].image)
  assert.equal(filterProducts(publicProducts(getProducts(storage)), { search: 'nueva' }).length, 0)
})

test('activar y desactivar oculta del público, pero conserva el producto en administración', () => {
  const storage = memoryStorage()
  setProductActive(products[0].id, false, storage)
  assert.equal(getProducts(storage).find((item) => item.id === products[0].id).active, false)
  assert.equal(publicProducts(getProducts(storage)).some((item) => item.id === products[0].id), false)
  assert.equal(getActiveProduct(products[0].id, storage), null)
  setProductActive(products[0].id, true, storage)
  assert.equal(getActiveProduct(products[0].id, storage).id, products[0].id)
})

test('no se duplican identificadores, incluso los iniciales o los guardados dos veces', () => {
  const storage = memoryStorage()
  assert.throws(() => saveProduct({ ...draft(), id: products[0].id }, storage), /identificador ya existe/)
  saveProduct(draft(), storage)
  assert.throws(() => saveProduct(draft(), storage), /identificador ya existe/)
  assert.equal(getProducts(storage).length, products.length + 1)
})

test('cambios a productos iniciales no son sobrescritos por la semilla al recargar', () => {
  const storage = memoryStorage()
  saveProduct({ ...getProducts(storage)[0], editing: true, price: 42, name: 'Pulso renovado' }, storage)
  assert.equal(getProducts(storage)[0].name, 'Pulso renovado')
  assert.equal(getProducts(storage)[0].price, 42)
  assert.equal(products[0].price, 24.99)
})

test('los pedidos históricos conservan nombre, precio, diseño e imagen al editar o desactivar', () => {
  const storage = memoryStorage()
  const product = saveProduct(draft(), storage)
  setProductInitialStock(product.id, 5, storage)
  addCartItem(cartItem(product), storage)
  const order = createOrder(details, storage, { idFactory: () => '11111111', now: () => new Date('2026-11-20T10:00:00Z') }).order
  saveProduct({ ...product, name: 'Nombre cambiado', image: products[2].image, price: 99, editing: true }, storage)
  setProductActive(product.id, false, storage)
  const historical = findOrder(order.id, storage).items[0]
  assert.equal(historical.name, 'Camiseta nueva')
  assert.equal(historical.price, 28.5)
  assert.equal(historical.productSnapshot.image, products[0].image)
  assert.equal(historical.elements[0].content, 'Original')
})

test('checkout rechaza productos desactivados incluso si ya estaban en el carrito', () => {
  const storage = memoryStorage()
  addCartItem(cartItem(products[0]), storage)
  setProductActive(products[0].id, false, storage)
  assert.throws(() => createOrder(details, storage), /no está disponible/)
  assert.equal(getCart(storage).length, 1)
  setProductActive(products[0].id, true, storage)
  assert.equal(createOrder(details, storage).order.status, 'Pagado')
})

test('datos corruptos y duplicados no se sobrescriben silenciosamente', () => {
  const storage = memoryStorage()
  storage.setItem(PRODUCTS_STORAGE_KEY, '{roto')
  assert.throws(() => getProducts(storage), /datos podrían estar dañados/)
  assert.throws(() => saveProduct(draft(), storage), /datos podrían estar dañados/)
  assert.equal(storage.getItem(PRODUCTS_STORAGE_KEY), '{roto')
  storage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify([draft(), draft()]))
  assert.throws(() => getProducts(storage), /datos podrían estar dañados/)
})

test('validación rechaza campos inválidos e imágenes no permitidas', () => {
  const storage = memoryStorage()
  for (const patch of [{ price: 0 }, { category: '' }, { colors: [] }, { colors: ['Rosa inventado'] }, { sizes: [] }, { image: 'https://otro-sitio.example/x.svg' }, { description: '' }]) {
    assert.throws(() => saveProduct({ ...draft(), ...patch }, storage), /Completa/)
  }
  assert.equal(storage.getItem(PRODUCTS_STORAGE_KEY), null)
})

test('un error de cuota conserva el catálogo original y avisa a las pestañas solo tras guardar', () => {
  const storage = memoryStorage()
  const beforeWindow = globalThis.window
  const fakeWindow = new EventTarget()
  globalThis.window = fakeWindow
  try {
    let changes = 0
    const unsubscribe = subscribeProducts(() => { changes++ })
    saveProduct(draft(), storage)
    assert.equal(changes, 1)
    const before = storage.getItem(PRODUCTS_STORAGE_KEY)
    const blocked = { ...storage, setItem: () => { const error = new Error('quota'); error.name = 'QuotaExceededError'; throw error } }
    assert.throws(() => setProductActive('prod-prueba', false, blocked), /espacio/)
    assert.equal(storage.getItem(PRODUCTS_STORAGE_KEY), before)
    assert.equal(changes, 1)
    const event = new Event('storage')
    Object.defineProperty(event, 'key', { value: PRODUCTS_STORAGE_KEY })
    fakeWindow.dispatchEvent(event)
    assert.equal(changes, 2)
    unsubscribe()
  } finally {
    if (beforeWindow === undefined) delete globalThis.window
    else globalThis.window = beforeWindow
  }
})
