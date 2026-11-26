import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { products } from '../src/data/products.js'
import { DESIGN_HEIGHT, DESIGN_WIDTH, PRINT_ZONE, createImage, createText, isOutsidePrint, moveElement, rotateElement, stagePoint } from '../src/data/customization.js'
import { initialPreviewColor, photoPreviewFor } from '../src/data/photoPreview.js'

test('cada producto abre su fotografía solo para la imagen y el color medidos', () => {
  const matching = [
    ['Negro', 'Pulso%20Urbano'],
    ['Blanco', 'L%C3%ADnea%20Libre'],
    ['Beige', 'Fuera%20de%20Serie'],
    ['Gris', 'Modo%20Creativo'],
  ]
  for (const [index, product] of products.entries()) {
    const [color, filename] = matching[index]
    const photo = photoPreviewFor(product, color)
    assert.equal(initialPreviewColor(product), color)
    assert.equal(product.colors.includes(color), true)
    assert.equal(photo.image, product.image)
    assert.match(photo.image, new RegExp(`images/nuevas/${filename}\\.jpeg$`))
    assert.equal(photo.image.startsWith(import.meta.env?.BASE_URL || '/'), true)
    assert.equal(photoPreviewFor(product, product.colors.find((choice) => choice !== color)), null)
  }
  assert.equal(photoPreviewFor(products[0], 'Blanco'), null)
  assert.equal(photoPreviewFor(products[1], 'Crema'), null)
  assert.equal(photoPreviewFor(products[2], 'Azul marino'), null)
  assert.equal(photoPreviewFor(products[3], 'Terracota'), null)
  assert.equal(photoPreviewFor({ ...products[0], image: 'data:image/jpeg;base64,AAAA' }, 'Negro'), null)
  assert.equal(photoPreviewFor({ ...products[0], image: '/images/pulso-urbano.svg' }, 'Negro'), null)
  assert.equal(initialPreviewColor({ ...products[1], image: 'data:image/jpeg;base64,AAAA' }), 'Crema')
})

test('la guía de la foto y las capas comparten coordenadas y escalan en móvil', () => {
  const { printZone } = photoPreviewFor(products[0], 'Negro')
  const scale = Math.min(DESIGN_WIDTH / 264, DESIGN_HEIGHT / 320)
  assert.ok(Math.abs(printZone[0].x - ((DESIGN_WIDTH - 264 * scale) / 2 + 80 * scale)) < 1e-9)
  assert.ok(Math.abs(printZone[0].y - (104 * scale)) < 1e-9)
  const text = createText('Trama', 't1')
  assert.equal(isOutsidePrint(text, printZone), false)
  assert.equal(isOutsidePrint({ ...text, x: 120 }, printZone), true)
  const moved = { ...text, ...moveElement(text, { x: 300, y: 345 }, { x: 320, y: 365 }) }
  const rotated = { ...moved, rotation: rotateElement(moved, { x: 420, y: 365 }, { x: 320, y: 465 }) }
  assert.equal(rotated.rotation, 90)
  assert.equal(isOutsidePrint(rotated, printZone), false)
  for (const point of [...printZone, { x: text.x, y: text.y }]) {
    const desktop = stagePoint(point.x, point.y, { left: 0, top: 0, width: 600, height: 650 })
    const mobile = stagePoint(20 + point.x / 2, 40 + point.y / 2, { left: 20, top: 40, width: 300, height: 325 })
    assert.deepEqual(desktop, mobile)
  }
  assert.notDeepEqual(printZone, PRINT_ZONE)
})

test('cada zona fue medida en su propia foto y permanece dentro del torso', () => {
  const sizes = [[264, 320], [259, 330], [261, 330], [266, 322]]
  const colors = ['Negro', 'Blanco', 'Beige', 'Gris']
  const polygons = []
  for (const [index, product] of products.entries()) {
    const [width, height] = sizes[index]
    const scale = Math.min(DESIGN_WIDTH / width, DESIGN_HEIGHT / height)
    const offsetX = (DESIGN_WIDTH - width * scale) / 2
    const offsetY = (DESIGN_HEIGHT - height * scale) / 2
    const zone = photoPreviewFor(product, colors[index]).printZone
    polygons.push(zone)
    assert.equal(zone.length, 6)
    for (const { x, y } of zone) {
      const sourceX = (x - offsetX) / scale
      const sourceY = (y - offsetY) / scale
      assert.ok(sourceX > width * 0.2 && sourceX < width * 0.81)
      assert.ok(sourceY > 90 && sourceY < height - 40)
    }
    assert.equal(isOutsidePrint(createImage({ dataUrl: 'data:image/png;base64,AAAA' }), zone), false)
    assert.equal(isOutsidePrint({ ...createText('fuera'), x: 50 }, zone), true)
  }
  assert.notDeepEqual(polygons[1], polygons[2])
  assert.notDeepEqual(polygons[2], polygons[3])
})

test('foto, texto, imagen y miniatura nueva se renderizan juntos; diseños históricos siguen siendo SVG', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  try {
    const { default: ShirtPreview } = await vite.ssrLoadModule('/src/components/ShirtPreview.jsx')
    const { default: ItemThumbnail } = await vite.ssrLoadModule('/src/components/ItemThumbnail.jsx')
    const { default: OrderItems } = await vite.ssrLoadModule('/src/components/OrderItems.jsx')
    const elements = [{ ...createText('Mi marca', 'texto'), rotation: 15 }, createImage({ dataUrl: 'data:image/png;base64,AAAA', name: 'logo.png' }, 'logo')]
    const config = { color: 'Negro', elements }
    const photo = renderToStaticMarkup(React.createElement(ShirtPreview, { product: products[0], customization: config, presentation: 'photo', showPrintGuide: true, selectedId: 'logo', onPointerDown: () => {} }))
    assert.match(photo, /Pulso%20Urbano\.jpeg/)
    assert.match(photo, /object-contain/)
    assert.match(photo, /Mi marca/)
    assert.match(photo, /rotate\(15deg\)/)
    assert.match(photo, /data:image\/png;base64,AAAA/)
    assert.ok(photo.indexOf('Mi marca') < photo.indexOf('data:image/png;base64,AAAA'))
    assert.match(photo, /aria-label="Redimensionar elemento"/)
    assert.match(photo, /<polygon/)
    assert.doesNotMatch(photo, /EN MOVIMIENTO/)
    const fallback = renderToStaticMarkup(React.createElement(ShirtPreview, { product: products[0], customization: { ...config, color: 'Blanco' }, presentation: 'photo' }))
    assert.doesNotMatch(fallback, /Pulso%20Urbano\.jpeg/)
    const item = { id: 'nuevo', productId: products[0].id, productSnapshot: products[0], name: products[0].name, color: 'Negro', size: 'M', quantity: 1, price: 29.99, elements, previewMode: 'photo-v1' }
    const newThumbnail = renderToStaticMarkup(React.createElement(ItemThumbnail, { item }))
    const oldThumbnail = renderToStaticMarkup(React.createElement(ItemThumbnail, { item: { ...item, previewMode: undefined } }))
    assert.match(newThumbnail, /Pulso%20Urbano\.jpeg/)
    assert.doesNotMatch(oldThumbnail, /Pulso%20Urbano\.jpeg/)
    assert.match(oldThumbnail, /<svg/)
    assert.match(oldThumbnail, /Mi marca/)
    const orderItems = renderToStaticMarkup(React.createElement(OrderItems, { items: [item, { ...item, id: 'historico', previewMode: undefined }] }))
    assert.equal(orderItems.match(/<img[^>]*src="[^"]*Pulso%20Urbano\.jpeg"/g)?.length, 1)
    assert.match(orderItems, /Mi marca/)
    for (const [index, color] of ['Negro', 'Blanco', 'Beige', 'Gris'].entries()) {
      const config = { color, elements }
      const html = renderToStaticMarkup(React.createElement(ShirtPreview, { product: products[index], customization: config, presentation: 'photo', showPrintGuide: true }))
      const thumbnail = renderToStaticMarkup(React.createElement(ItemThumbnail, { item: { ...item, id: `foto-${index}`, productId: products[index].id, productSnapshot: products[index], color } }))
      assert.ok(html.includes(products[index].image))
      assert.ok(thumbnail.includes(products[index].image))
      assert.match(html, /Mi marca/)
      assert.match(html, /data:image\/png;base64,AAAA/)
      assert.match(html, /<polygon/)
    }
  } finally { await vite.close() }
})
