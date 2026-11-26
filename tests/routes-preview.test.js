import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { readFileSync } from 'node:fs'
import { products } from '../src/data/products.js'
import { colorChoice, createImage, createText, defaultCustomization, printColors, shirtColors } from '../src/data/customization.js'

test('el salto al contenido no sustituye la ruta hash de GitHub Pages', () => {
  const header = readFileSync(new URL('../src/components/Header.jsx', import.meta.url), 'utf8')
  const layout = readFileSync(new URL('../src/components/Layout.jsx', import.meta.url), 'utf8')
  assert.match(header, /main\?\.focus\(\); main\?\.scrollIntoView\(\)/)
  assert.match(header, /Ir al contenido<\/button>/)
  assert.doesNotMatch(header, /href="#contenido"/)
  assert.match(layout, /<main id="contenido" tabIndex={-1}/)
})

test('los selectores muestran colores por nombre y por hex sin exigir una etiqueta', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  try {
    const { default: ColorChoices } = await vite.ssrLoadModule('/src/components/ColorChoices.jsx')
    const shirt = renderToStaticMarkup(React.createElement(ColorChoices, {
      options: products[0].colors.map((value) => ({ name: value, value })), selected: 'Negro', onSelect: () => {},
    }))
    assert.match(shirt, /aria-label="Color Negro"/)
    assert.match(shirt, /background-color:#252c28/)
    assert.match(shirt, /aria-label="Color Verde oliva"/)

    const ink = renderToStaticMarkup(React.createElement(ColorChoices, {
      options: [...printColors, { value: '#232323' }], selected: '#232323', onSelect: () => {},
    }))
    assert.match(ink, /aria-label="Color Negro"/)
    assert.match(ink, /aria-label="Color #232323"/)
    assert.match(ink, /background-color:#232323/)
    assert.match(ink, /aria-pressed="true"/)
    assert.equal(colorChoice({ value: 'Color desconocido' }).swatch, '#e5e7eb')
    assert.equal(shirtColors['Verde oliva'], colorChoice({ value: 'Verde oliva' }).swatch)
  } finally {
    await vite.close()
  }
})

test('la vista previa refleja color, texto e imagen seleccionados', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  try {
    const { default: ShirtPreview } = await vite.ssrLoadModule('/src/components/ShirtPreview.jsx')
    const config = { ...defaultCustomization, color: 'Crema', elements: [{ ...createText('Mi diseño', 'uno'), color: '#24465b', font: 'Georgia, serif', x: 360, rotation: 32 }, createImage({ dataUrl: 'data:image/png;base64,AAAA', name: 'logo.png' }, 'dos')] }
    const html = renderToStaticMarkup(React.createElement(ShirtPreview, { product: products[1], customization: config }))
    assert.match(html, /fill="#eee6d6"/)
    assert.match(html, /Mi diseño/)
    assert.match(html, /font-family:Georgia, serif/)
    assert.match(html, /data:image\/png;base64,AAAA/)
    assert.match(html, /rotate\(32deg\)/)
    assert.match(html, /left:60%/)
    const changed = renderToStaticMarkup(React.createElement(ShirtPreview, { product: products[0], customization: { ...defaultCustomization, color: 'Blanco', elements: [{ ...createText('Hola', 'tres'), color: '#232323' }] } }))
    assert.match(changed, /fill="#f8f7f2"/)
    assert.match(changed, /color:#232323/)
  } finally {
    await vite.close()
  }
})
