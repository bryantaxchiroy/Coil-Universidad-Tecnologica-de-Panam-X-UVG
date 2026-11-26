// The same URLs work at localhost / and under the GitHub Pages repository path.
const imageBase = import.meta.env?.BASE_URL || '/'

// Keep previous public URLs available for saved product overrides and historical snapshots.
export const legacyProductImages = {
  'pulso-urbano': `${imageBase}images/pulso-urbano.svg`,
  'linea-libre': `${imageBase}images/linea-libre.svg`,
  'fuera-de-serie': `${imageBase}images/fuera-de-serie.svg`,
  'modo-creativo': `${imageBase}images/modo-creativo.svg`,
}

// Variants that existed before the photographic preview. Only these receive
// the original demo inventory baseline; newly introduced colors start at zero.
export const originalProductColors = {
  'pulso-urbano': ['Negro', 'Blanco', 'Verde oliva'],
  'linea-libre': ['Crema', 'Negro', 'Azul marino'],
  'fuera-de-serie': ['Azul marino', 'Blanco', 'Gris'],
  'modo-creativo': ['Terracota', 'Crema', 'Negro'],
}

export const newPhotoColors = {
  'linea-libre': 'Blanco',
  'fuera-de-serie': 'Beige',
  'modo-creativo': 'Gris',
}

export const products = [
  {
    id: 'pulso-urbano',
    name: 'Pulso urbano',
    description: 'Gráfica urbana para seguir tu propio ritmo.',
    price: 24.99,
    category: 'Gráficas',
    colors: originalProductColors['pulso-urbano'],
    sizes: ['S', 'M', 'L', 'XL'],
    image: `${imageBase}images/nuevas/Pulso%20Urbano.jpeg`,
    imageAlt: 'Fotografía de camiseta negra con estrella blanca de Pulso urbano',
    background: 'bg-[#e6e9dc]',
    badge: 'Favorita',
  },
  {
    id: 'linea-libre',
    name: 'Línea libre',
    description: 'Trazos ligeros para expresarte con libertad.',
    price: 22.99,
    category: 'Minimalistas',
    colors: [...originalProductColors['linea-libre'], newPhotoColors['linea-libre']],
    sizes: ['S', 'M', 'L', 'XL'],
    image: `${imageBase}images/nuevas/L%C3%ADnea%20Libre.jpeg`,
    imageAlt: 'Fotografía de camiseta blanca con estrella negra de Línea libre',
    background: 'bg-[#eee8df]',
    badge: 'Nueva',
  },
  {
    id: 'fuera-de-serie',
    name: 'Fuera de serie',
    description: 'Tipografía con personalidad propia.',
    price: 26.99,
    category: 'Tipográficas',
    colors: [...originalProductColors['fuera-de-serie'], newPhotoColors['fuera-de-serie']],
    sizes: ['S', 'M', 'L', 'XL'],
    image: `${imageBase}images/nuevas/Fuera%20de%20Serie.jpeg`,
    imageAlt: 'Fotografía de camiseta beige con texto GOOD VIBES de Fuera de serie',
    background: 'bg-[#e3e8eb]',
  },
  {
    id: 'modo-creativo',
    name: 'Modo creativo',
    description: 'Una camiseta para ideas fuera de lo común.',
    price: 24.99,
    category: 'Gráficas',
    colors: [...originalProductColors['modo-creativo'], newPhotoColors['modo-creativo']],
    sizes: ['S', 'M', 'L', 'XL'],
    image: `${imageBase}images/nuevas/Modo%20Creativo.jpeg`,
    imageAlt: 'Fotografía de camiseta gris con líneas onduladas de Modo creativo',
    background: 'bg-[#efe4db]',
  },
]

export const formatPrice = (price) =>
  new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(price)

export const categories = [...new Set(products.map((product) => product.category))]
export const sizes = [...new Set(products.flatMap((product) => product.sizes))]
export const colors = [...new Set(products.flatMap((product) => product.colors))]

export function filterProducts(items, { search = '', category = '', size = '', color = '' }) {
  const query = search.trim().toLocaleLowerCase('es')
  return items.filter((product) =>
    product.name.toLocaleLowerCase('es').includes(query) &&
    (!category || product.category === category) &&
    (!size || product.sizes.includes(size)) &&
    (!color || product.colors.includes(color)),
  )
}
