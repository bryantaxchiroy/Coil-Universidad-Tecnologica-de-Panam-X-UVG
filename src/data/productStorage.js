import { legacyProductImages, newPhotoColors, products } from './products.js'
import { shirtColors } from './customization.js'

export const PRODUCTS_STORAGE_KEY = 'trama-products'
export const PRODUCTS_CHANGE_EVENT = 'trama:products-change'

const allowedImages = new Set([...products.map((product) => product.image), ...Object.values(legacyProductImages)])
const validImage = (image) => allowedImages.has(image) || /^data:image\/(?:png|jpeg);base64,[a-z0-9+/=]+$/i.test(image)
const validProduct = (item) => item && typeof item.id === 'string' && item.id.length > 0 &&
  typeof item.name === 'string' && item.name.trim() && typeof item.description === 'string' && item.description.trim() &&
  typeof item.category === 'string' && item.category.trim() && Number.isFinite(item.price) && item.price > 0 &&
  Array.isArray(item.colors) && item.colors.length > 0 && item.colors.every((color) => Object.hasOwn(shirtColors, color)) &&
  Array.isArray(item.sizes) && item.sizes.length > 0 && item.sizes.every((size) => typeof size === 'string' && size.trim()) &&
  typeof item.image === 'string' && validImage(item.image) && typeof item.active === 'boolean'

export function subscribeProducts(listener) {
  window.addEventListener(PRODUCTS_CHANGE_EVENT, listener)
  const onStorage = (event) => {
    if (event.key === PRODUCTS_STORAGE_KEY || event.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(PRODUCTS_CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

// Persist only additions/overrides. An untouched seed product is never copied
// into storage, so future releases can still add new seed products.
export function getProducts(storage = window.localStorage) {
  try {
    const raw = storage.getItem(PRODUCTS_STORAGE_KEY)
    const changes = raw === null ? [] : JSON.parse(raw)
    if (!Array.isArray(changes) || !changes.every(validProduct) || new Set(changes.map((item) => item.id)).size !== changes.length) throw new Error('invalid-products')
    const overrides = new Map(changes.map((item) => [item.id, item]))
    return [
      ...products.map((item) => {
        const override = overrides.get(item.id)
        // Migrate only this starter product's own default image. Other fields and
        // administrator-selected images stay untouched; no localStorage write is needed.
        const migrated = override?.image === legacyProductImages[item.id]
          ? { ...override, image: item.image, imageAlt: item.imageAlt }
          : override
        const result = { ...item, active: true, ...migrated }
        // Older saved edits predate the new photo color. Add only that option
        // in memory; a later admin save records the version, so future edits
        // to the color list remain under administrator control.
        if (override && !override.photoColorV2 && newPhotoColors[item.id] && !result.colors.includes(newPhotoColors[item.id])) {
          result.colors = [...result.colors, newPhotoColors[item.id]]
        }
        return result
      }),
      ...changes.filter((item) => !products.some((seed) => seed.id === item.id)),
    ]
  } catch {
    throw new Error('No se pudo leer el catálogo guardado. Los datos podrían estar dañados o el almacenamiento no está disponible; no se sobrescribirán.')
  }
}

export function publicProducts(items) {
  return items.filter((item) => item.active !== false)
}

export function getActiveProduct(id, storage = window.localStorage) {
  return publicProducts(getProducts(storage)).find((item) => item.id === id) || null
}

export function saveProduct(input, storage = window.localStorage) {
  const current = getProducts(storage)
  const existing = current.find((item) => item.id === input.id)
  if (existing && !input.editing) throw new Error('Este identificador ya existe. No se duplicó el producto.')
  if (!existing && input.editing) throw new Error('El producto ya no existe. Actualiza el listado.')
  const product = {
    ...(existing || {}),
    ...input,
    id: existing?.id || input.id || `prod-${crypto.randomUUID()}`,
    name: input.name?.trim(),
    description: input.description?.trim(),
    category: input.category?.trim(),
    colors: input.colors?.map((value) => value.trim()).filter(Boolean),
    sizes: input.sizes?.map((value) => value.trim()).filter(Boolean),
    price: Number(input.price),
    imageAlt: input.name?.trim(),
    background: existing?.background || 'bg-[#e8ece0]',
    ...(products.some((seed) => seed.id === input.id) ? { photoColorV2: true } : {}),
  }
  delete product.editing
  delete product.initialStock
  if (!validProduct(product)) throw new Error('Completa nombre, descripción, precio mayor que cero, categoría, colores de la paleta Trama, tallas e imagen válida.')
  const changes = current.filter((item) => item.id !== product.id && (!products.some((seed) => seed.id === item.id) || JSON.stringify(item) !== JSON.stringify({ ...products.find((seed) => seed.id === item.id), active: true })))
  // Keep existing overrides intact, including deactivated seed products.
  const persisted = [...changes, product]
  try { storage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(persisted)) }
  catch (error) {
    if (error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014) throw new Error('No hay espacio para guardar el catálogo. Reduce la imagen o libera espacio; los cambios no se guardaron.')
    throw new Error('No se pudo guardar el catálogo. Comprueba el almacenamiento; los cambios siguen en el formulario.')
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRODUCTS_CHANGE_EVENT))
  return product
}

export function setProductActive(id, active, storage = window.localStorage) {
  const product = getProducts(storage).find((item) => item.id === id)
  if (!product) throw new Error('Producto no encontrado.')
  return saveProduct({ ...product, active, editing: true }, storage)
}
