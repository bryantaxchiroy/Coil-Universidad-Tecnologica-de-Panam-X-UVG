import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { products } from '../src/data/products.js'
import { DESIGN_HEIGHT, DESIGN_WIDTH, PRINT_ZONE, cartDesignElements, createImage, createText, customizationCost, duplicateElement, isOutsidePrint, moveElement, reorderElement, resizeElement, rotateElement, stagePoint, updateElement } from '../src/data/customization.js'
import { addCartItem, getCart } from '../src/data/cartStorage.js'

test('varios textos e imágenes se agregan, editan, duplican, seleccionan y eliminan independientemente', () => {
  const original = [createText('Primero', 't1'), createText('Segundo', 't2'), createImage({ dataUrl: 'data:image/png;base64,AAAA', name: 'a.png' }, 'i1'), createImage({ dataUrl: 'data:image/jpeg;base64,BBBB', name: 'b.jpg', width: 400, height: 200 }, 'i2')]
  assert.equal(customizationCost({ elements: original }), 5)
  assert.equal(original[3].height, 52.5)
  const changed = updateElement(original, 't2', { content: 'Editado' })
  assert.equal(changed[0].content, 'Primero')
  assert.equal(changed[1].content, 'Editado')
  const doubled = duplicateElement(changed, 'i1', 'i3')
  assert.deepEqual(doubled.map(({ id }) => id), ['t1', 't2', 'i1', 'i3', 'i2'])
  assert.equal(doubled[3].content, doubled[2].content)
  const selectedId = 'i1'
  assert.deepEqual(doubled.filter(({ id }) => id !== selectedId).map(({ id }) => id), ['t1', 't2', 'i3', 'i2'])
  assert.equal(customizationCost({ elements: [] }), 0)
})

test('mover, redimensionar, girar y ordenar capas no limita posiciones ni tamaños máximos', () => {
  const text = createText('Libre', 't')
  const image = createImage({ dataUrl: 'data:image/png;base64,AAAA', width: 200, height: 100 }, 'i')
  assert.deepEqual(moveElement(text, { x: 0, y: 0 }, { x: -550, y: 800 }), { x: -250, y: 1145 })
  assert.equal(resizeElement(text, 900, 70).width, 900)
  assert.equal(resizeElement(text, -10, 0).height, 1)
  assert.deepEqual(resizeElement(image, 400, 999), { width: 400, height: 200 })
  assert.deepEqual(resizeElement(image, 400, 999, false), { width: 400, height: 999 })
  assert.equal(rotateElement(text, { x: 400, y: 345 }, { x: 300, y: 445 }), 90)
  assert.equal(isOutsidePrint({ ...text, x: 100 }), true)
  assert.equal(isOutsidePrint({ ...text, width: 120, x: 300 }), false)
  assert.deepEqual(reorderElement([text, image], 't', true).map(({ id }) => id), ['i', 't'])
  assert.deepEqual(reorderElement([text, image], 'i', false).map(({ id }) => id), ['i', 't'])
})

test('el mismo punto se conserva al cambiar el tamaño de la vista previa', () => {
  const desktop = stagePoint(350, 390, { left: 50, top: 65, width: 600, height: 650 })
  const mobile = stagePoint(175, 195, { left: 25, top: 32.5, width: 300, height: 325 })
  assert.deepEqual(desktop, { x: 300, y: 325 })
  assert.deepEqual(mobile, desktop)
})

test('la zona imprimible sigue el torso: pecho, centro, laterales y parte inferior son válidos', () => {
  const text = createText('Pecho', 't')
  const image = createImage({ dataUrl: 'data:image/png;base64,AAAA' }, 'i')
  assert.equal(isOutsidePrint({ ...text, x: 300, y: 171, width: 160, height: 40 }), false)
  assert.equal(isOutsidePrint({ ...text, x: 300, y: 511, width: 150, height: 32 }), false)
  assert.equal(isOutsidePrint(image), false)
  assert.equal(isOutsidePrint({ ...image, x: 387, y: 345, width: 36, height: 50 }), false)
  assert.equal(isOutsidePrint({ ...image, x: 410, y: 345, width: 35, height: 35 }), true)
  assert.equal(isOutsidePrint({ ...text, x: 300, y: 540, width: 100, height: 20 }), true)
  assert.equal(isOutsidePrint({ ...text, x: 300, y: 130, width: 100, height: 20 }), true)
})

test('se comprueban las cuatro esquinas rotadas, no solo el centro o la caja sin girar', () => {
  const text = { ...createText('Giro', 't'), x: 200, y: 320, width: 28, height: 28 }
  assert.equal(isOutsidePrint(text), false)
  assert.equal(isOutsidePrint({ ...text, rotation: 45 }), true)
  assert.equal(isOutsidePrint({ ...text, x: 300, rotation: 45 }), false)
  assert.equal(isOutsidePrint({ ...text, x: 300, y: 513, width: 110, height: 30, rotation: 45 }), true)
})

test('el polígono y los elementos usan el mismo viewBox a cualquier escala', () => {
  const polygon = PRINT_ZONE.map(({ x, y }) => ({ x, y }))
  for (const scale of [1, 0.5, 1.4]) {
    const rect = { left: 23, top: 42, width: DESIGN_WIDTH * scale, height: DESIGN_HEIGHT * scale }
    for (const vertex of polygon) {
      const pixel = { x: rect.left + vertex.x * scale, y: rect.top + vertex.y * scale }
      const actual = stagePoint(pixel.x, pixel.y, rect)
      assert.ok(Math.abs(actual.x - vertex.x) < 1e-9)
      assert.ok(Math.abs(actual.y - vertex.y) < 1e-9)
    }
  }
})

test('guardar y recuperar el carrito conserva todas las capas y sigue leyendo artículos antiguos', () => {
  const data = new Map()
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
  const elements = [createText('Uno', 't1'), { ...createText('Dos', 't2'), x: 615, rotation: -42 }, createImage({ dataUrl: 'data:image/png;base64,AAAA', name: 'uno.png', mimeType: 'image/png' }, 'i1'), createImage({ dataUrl: 'data:image/png;base64,BBBB', name: 'dos.png', mimeType: 'image/png' }, 'i2')]
  addCartItem({ id: 'nuevo', productId: products[0].id, name: products[0].name, size: 'M', color: 'Blanco', quantity: 2, price: 29.99, elements }, storage)
  addCartItem({ id: 'antiguo', productId: products[0].id, name: products[0].name, size: 'S', color: 'Negro', quantity: 1, price: 24, text: { content: 'Antes', x: 50, y: 30 }, image: { dataUrl: 'data:image/png;base64,CCCC', size: 45 } }, storage)
  const recovered = getCart(storage)
  assert.deepEqual(recovered[0].elements, elements)
  assert.equal(recovered[0].quantity, 2)
  assert.deepEqual(cartDesignElements(recovered[1]).map(({ type }) => type), ['image', 'text'])
  assert.deepEqual(cartDesignElements(recovered[1]).map(({ x, y }) => ({ x, y })), [{ x: 300, y: 393.1 }, { x: 300, y: 318.2 }])
  assert.equal(isOutsidePrint(recovered[0].elements[0]), false)
})

test('la vista previa renderiza las capas en orden y mantiene unidades relativas', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  try {
    const { default: ShirtPreview } = await vite.ssrLoadModule('/src/components/ShirtPreview.jsx')
    const elements = [createText('A', 'a'), { ...createImage({ dataUrl: 'data:image/png;base64,AAAA' }, 'b'), x: 150, rotation: 45 }, createText('C', 'c')]
    const html = renderToStaticMarkup(React.createElement(ShirtPreview, { product: products[0], customization: { color: 'Blanco', elements }, selectedId: 'b', onPointerDown: () => {} }))
    assert.ok(html.indexOf('data-element-id="a"') < html.indexOf('data-element-id="b"'))
    assert.ok(html.indexOf('data-element-id="b"') < html.indexOf('data-element-id="c"'))
    assert.match(html, /left:25%;top:56.15384615384615%/)
    assert.match(html, /rotate\(45deg\)/)
    assert.match(html, /aria-label="Redimensionar elemento"/)
    assert.match(html, /cqw/)
    const withGuide = renderToStaticMarkup(React.createElement(ShirtPreview, { product: products[0], customization: { color: 'Blanco', elements }, showPrintGuide: true }))
    assert.match(withGuide, new RegExp(`points="${PRINT_ZONE.map(({ x, y }) => `${x},${y}`).join(' ')}"`))
    assert.doesNotMatch(html, /<polygon/)
  } finally { await vite.close() }
})
