export const shirtColors = {
  Negro: '#252c28',
  Blanco: '#f8f7f2',
  'Verde oliva': '#677456',
  Crema: '#eee6d6',
  'Azul marino': '#253e52',
  Gris: '#929995',
  Terracota: '#bb7259',
}

export const printColors = [
  { name: 'Negro', value: '#232b23' },
  { name: 'Blanco', value: '#ffffff' },
  { name: 'Verde lima', value: '#d8f28a' },
  { name: 'Azul', value: '#24465b' },
  { name: 'Terracota', value: '#b65e42' },
]

// Shirt colors use names; print colors use hex values. Keep both as valid swatches.
export function colorChoice({ name, value, swatch }) {
  const hex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
  return {
    name: name || value,
    value,
    swatch: swatch || shirtColors[value] || (hex.test(value) ? value : '#e5e7eb'),
  }
}

export const fonts = [
  { name: 'Outfit', value: 'Outfit, sans-serif' },
  { name: 'DM Sans', value: 'DM Sans, sans-serif' },
  { name: 'Serif', value: 'Georgia, serif' },
  { name: 'Monoespaciada', value: 'Courier New, monospace' },
]

export const defaultCustomization = {
  size: '',
  color: '',
  elements: [],
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)))

// All geometry uses the fixed 600 × 650 illustration coordinate system.
export const DESIGN_WIDTH = 600
export const DESIGN_HEIGHT = 650
// Interior of the SVG shirt body: collar ends near y=124, torso sides are
// x=173/427 from y=235 to 543, and the curved hem reaches y≈556 at center.
// These vertices leave room for seams, collar and hem while following the torso.
export const PRINT_ZONE = [
  { x: 205, y: 146 }, { x: 395, y: 146 },
  { x: 414, y: 228 }, { x: 414, y: 522 },
  { x: 300, y: 538 }, { x: 186, y: 522 }, { x: 186, y: 228 },
]

// Pre-editor cart positions were percentages of the original 180 × 214 guide.
const LEGACY_PRINT_ZONE = { left: 210, top: 254, width: 180, height: 214 }

export function stagePoint(clientX, clientY, rect) {
  return { x: (clientX - rect.left) * DESIGN_WIDTH / rect.width, y: (clientY - rect.top) * DESIGN_HEIGHT / rect.height }
}

export function moveElement(element, start, current) {
  return { x: element.x + current.x - start.x, y: element.y + current.y - start.y }
}

export function rotateElement(element, start, current) {
  const angle = (point) => Math.atan2(point.y - element.y, point.x - element.x) * 180 / Math.PI
  return element.rotation + angle(current) - angle(start)
}

export function createText(content = 'Tu texto', id = crypto.randomUUID()) {
  return { id, type: 'text', content, x: 300, y: 345, width: 180, height: 48, rotation: 0, color: '#232b23', font: fonts[0].value }
}

export function createImage(image, id = crypto.randomUUID()) {
  const ratio = image.width && image.height ? image.width / image.height : 1
  return { id, type: 'image', content: image.dataUrl, name: image.name, mimeType: image.mimeType, x: 300, y: 365, width: 105, height: 105 / ratio, rotation: 0, lockAspect: true }
}

export function updateElement(elements, id, patch) {
  return elements.map((element) => element.id === id ? { ...element, ...patch } : element)
}

export function duplicateElement(elements, id, newId = crypto.randomUUID()) {
  const index = elements.findIndex((element) => element.id === id)
  if (index < 0) return elements
  const source = elements[index]
  const copy = { ...source, id: newId, x: source.x + 18, y: source.y + 18 }
  return [...elements.slice(0, index + 1), copy, ...elements.slice(index + 1)]
}

export function reorderElement(elements, id, toFront) {
  const element = elements.find((entry) => entry.id === id)
  if (!element) return elements
  const rest = elements.filter((entry) => entry.id !== id)
  return toFront ? [...rest, element] : [element, ...rest]
}

export function resizeElement(element, width, height, lockAspect = element.lockAspect) {
  const safeWidth = Math.max(1, Number(width) || 1)
  const safeHeight = Math.max(1, Number(height) || 1)
  return { width: safeWidth, height: element.type === 'image' && lockAspect ? safeWidth * element.height / element.width : safeHeight }
}

export function isOutsidePrint(element) {
  const { x, y, width, height, rotation } = element
  if (![x, y, width, height, rotation].every(Number.isFinite) || width <= 0 || height <= 0) return true
  const angle = rotation * Math.PI / 180
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  // The valid region is convex: if all four rotated corners are inside,
  // the entire rectangular footprint is inside, not just its center.
  for (const dx of [-width / 2, width / 2]) {
    for (const dy of [-height / 2, height / 2]) {
      const cornerX = x + dx * cosine - dy * sine
      const cornerY = y + dx * sine + dy * cosine
      for (let i = 0; i < PRINT_ZONE.length; i++) {
        const a = PRINT_ZONE[i]
        const b = PRINT_ZONE[(i + 1) % PRINT_ZONE.length]
        if ((b.x - a.x) * (cornerY - a.y) - (b.y - a.y) * (cornerX - a.x) < -1e-7) return true
      }
    }
  }
  return false
}

export function customizationCost(config) {
  if (Array.isArray(config.elements)) {
    return (config.elements.some((element) => element.type === 'text' && element.content.trim()) ? 2 : 0) +
      (config.elements.some((element) => element.type === 'image') ? 3 : 0)
  }
  return (config.text?.trim() ? 2 : 0) + (config.image ? 3 : 0)
}

// Older cart entries stored a single text and image with positions relative to the print zone.
export function cartDesignElements(item) {
  if (Array.isArray(item.elements)) return item.elements
  const elements = []
  if (item.image?.dataUrl) {
    const size = item.image.size ?? 45
    elements.push({ id: 'legacy-image', type: 'image', content: item.image.dataUrl, name: item.image.name, x: LEGACY_PRINT_ZONE.left + (item.image.x ?? 50) * LEGACY_PRINT_ZONE.width / 100, y: LEGACY_PRINT_ZONE.top + (item.image.y ?? 65) * LEGACY_PRINT_ZONE.height / 100, width: size * LEGACY_PRINT_ZONE.width / 100, height: size * LEGACY_PRINT_ZONE.width / 100, rotation: 0 })
  }
  if (item.text?.content) elements.push({ id: 'legacy-text', type: 'text', content: item.text.content, color: item.text.color || '#232b23', font: item.text.font || fonts[0].value, x: LEGACY_PRINT_ZONE.left + (item.text.x ?? 50) * LEGACY_PRINT_ZONE.width / 100, y: LEGACY_PRINT_ZONE.top + (item.text.y ?? 30) * LEGACY_PRINT_ZONE.height / 100, width: 150, height: 50, rotation: 0 })
  return elements
}

export function imagePosition(x, y, size) {
  return {
    x: clamp(x, size / 2, 100 - size / 2),
    y: clamp(y, size / 2, 100 - size / 2),
  }
}
