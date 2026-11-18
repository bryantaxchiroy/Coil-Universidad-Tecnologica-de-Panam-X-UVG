import test from 'node:test'
import assert from 'node:assert/strict'
import { filterProducts, products } from '../src/data/products.js'
import { customizationCost, imagePosition } from '../src/data/customization.js'
import { addCartItem, CART_STORAGE_KEY } from '../src/data/cartStorage.js'

test('la búsqueda y los filtros combinados respetan los datos del catálogo', () => {
  assert.deepEqual(filterProducts(products, { search: 'LÍNEA', category: 'Minimalistas', size: 'M', color: 'Crema' }).map(({ id }) => id), ['linea-libre'])
  assert.equal(filterProducts(products, { search: 'ninguno', category: '', size: '', color: '' }).length, 0)
  assert.equal(filterProducts(products, { search: '', category: '', size: '', color: '' }).length, products.length)
})

test('los costos adicionales dependen solo del texto y la imagen', () => {
  assert.equal(customizationCost({ text: '   ', image: null }), 0)
  assert.equal(customizationCost({ text: 'Hola', image: null }), 2)
  assert.equal(customizationCost({ text: '', image: { dataUrl: 'data:image/png;base64,AAAA' } }), 3)
  assert.equal(customizationCost({ text: 'Hola', image: { dataUrl: 'data:image/png;base64,AAAA' } }), 5)
})

test('la imagen se mantiene dentro del área de impresión al cambiar su tamaño', () => {
  assert.deepEqual(imagePosition(0, 100, 70), { x: 35, y: 65 })
  assert.deepEqual(imagePosition(50, 50, 20), { x: 50, y: 50 })
})

test('el carrito conserva artículos previos y no sobrescribe el estado al exceder cuota', () => {
  const contents = new Map()
  const storage = { getItem: (key) => contents.get(key) ?? null, setItem: (key, value) => contents.set(key, value) }
  const first = { id: 'uno', productId: 'pulso-urbano', name: 'Pulso urbano', size: 'M', color: 'Negro', price: 24.99, quantity: 1 }
  addCartItem(first, storage)
  addCartItem({ ...first, id: 'dos', productId: 'linea-libre' }, storage)
  assert.deepEqual(JSON.parse(contents.get(CART_STORAGE_KEY)).map(({ id }) => id), ['uno', 'dos'])
  const before = contents.get(CART_STORAGE_KEY)
  assert.throws(() => addCartItem({ ...first, id: 'tres' }, { ...storage, setItem: () => { const error = new Error('Quota exceeded'); error.name = 'QuotaExceededError'; throw error } }), /imagen más pequeña/)
  assert.equal(contents.get(CART_STORAGE_KEY), before)
})
