import { DESIGN_HEIGHT, DESIGN_WIDTH } from './customization.js'
import { products } from './products.js'

// Coordinates are measured in each JPEG's own pixels, not copied from the
// SVG or another shirt. The inset avoids sleeves, collar, hem and photo edges.
const photos = {
  'pulso-urbano': {
    image: products[0].image, color: 'Negro', width: 264, height: 320,
    printArea: [
      { x: 80, y: 104 }, { x: 192, y: 104 },
      { x: 203, y: 154 }, { x: 201, y: 271 },
      { x: 65, y: 271 }, { x: 63, y: 154 },
    ],
  },
  'linea-libre': {
    image: products[1].image, color: 'Blanco', width: 259, height: 330,
    printArea: [
      { x: 75, y: 98 }, { x: 185, y: 98 },
      { x: 204, y: 149 }, { x: 201, y: 279 },
      { x: 58, y: 279 }, { x: 55, y: 149 },
    ],
  },
  'fuera-de-serie': {
    image: products[2].image, color: 'Beige', width: 261, height: 330,
    printArea: [
      { x: 76, y: 95 }, { x: 187, y: 95 },
      { x: 205, y: 151 }, { x: 200, y: 278 },
      { x: 61, y: 278 }, { x: 56, y: 151 },
    ],
  },
  'modo-creativo': {
    image: products[3].image, color: 'Gris', width: 266, height: 322,
    printArea: [
      { x: 77, y: 99 }, { x: 190, y: 99 },
      { x: 211, y: 151 }, { x: 205, y: 277 },
      { x: 61, y: 277 }, { x: 55, y: 151 },
    ],
  },
}

export function photoPreviewFor(product, color) {
  const photo = photos[product?.id]
  if (!photo || product.image !== photo.image || color !== photo.color) return null
  // The photo uses object-fit: contain inside the same 600 × 650 stage as
  // the editor. Apply that exact transform to its print-area vertices.
  const scale = Math.min(DESIGN_WIDTH / photo.width, DESIGN_HEIGHT / photo.height)
  const offsetX = (DESIGN_WIDTH - photo.width * scale) / 2
  const offsetY = (DESIGN_HEIGHT - photo.height * scale) / 2
  return {
    image: photo.image,
    printZone: photo.printArea.map(({ x, y }) => ({ x: offsetX + x * scale, y: offsetY + y * scale })),
  }
}

export function initialPreviewColor(product) {
  const color = photos[product?.id]?.color
  return color && product.colors.includes(color) && photoPreviewFor(product, color) ? color : product.colors[0]
}
