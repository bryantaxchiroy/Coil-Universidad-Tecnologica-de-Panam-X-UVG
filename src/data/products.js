// The same URLs work at localhost / and under the GitHub Pages repository path.
const imageBase = import.meta.env?.BASE_URL || '/'

export const products = [
  {
    id: 'pulso-urbano',
    name: 'Pulso urbano',
    price: 24.99,
    category: 'Gráficas',
    colors: ['Negro', 'Blanco', 'Verde oliva'],
    sizes: ['S', 'M', 'L', 'XL'],
    image: `${imageBase}images/pulso-urbano.svg`,
    imageAlt: 'Camiseta negra Pulso urbano con diseño gráfico verde lima',
    background: 'bg-[#e6e9dc]',
    badge: 'Favorita',
  },
  {
    id: 'linea-libre',
    name: 'Línea libre',
    price: 22.99,
    category: 'Minimalistas',
    colors: ['Crema', 'Negro', 'Azul marino'],
    sizes: ['S', 'M', 'L', 'XL'],
    image: `${imageBase}images/linea-libre.svg`,
    imageAlt: 'Camiseta crema Línea libre con dibujo lineal azul',
    background: 'bg-[#eee8df]',
    badge: 'Nueva',
  },
  {
    id: 'fuera-de-serie',
    name: 'Fuera de serie',
    price: 26.99,
    category: 'Tipográficas',
    colors: ['Azul marino', 'Blanco', 'Gris'],
    sizes: ['S', 'M', 'L', 'XL'],
    image: `${imageBase}images/fuera-de-serie.svg`,
    imageAlt: 'Camiseta azul marino Fuera de serie con diseño tipográfico',
    background: 'bg-[#e3e8eb]',
  },
  {
    id: 'modo-creativo',
    name: 'Modo creativo',
    price: 24.99,
    category: 'Gráficas',
    colors: ['Terracota', 'Crema', 'Negro'],
    sizes: ['S', 'M', 'L', 'XL'],
    image: `${imageBase}images/modo-creativo.svg`,
    imageAlt: 'Camiseta terracota Modo creativo con diseño abstracto',
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
