import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, Copy, ImagePlus, Minus, Plus, RotateCcw, ShoppingBag, Sparkles, Trash2 } from 'lucide-react'
import Button from '../components/Button.jsx'
import ColorChoices from '../components/ColorChoices.jsx'
import ShirtPreview from '../components/ShirtPreview.jsx'
import { formatPrice } from '../data/products.js'
import { getActiveProduct, publicProducts } from '../data/productStorage.js'
import useProducts from '../hooks/useProducts.js'
import useInventory from '../hooks/useInventory.js'
import { groupedVariants, stockFor, variantKey } from '../data/inventoryStorage.js'
import { getCart } from '../data/cartStorage.js'
import { createImage, createText, customizationCost, defaultCustomization, duplicateElement, fonts, isOutsidePrint, moveElement, printColors, reorderElement, resizeElement, rotateElement, stagePoint, updateElement } from '../data/customization.js'
import { initialPreviewColor, photoPreviewFor } from '../data/photoPreview.js'
import { addCartItem, cartTotals, DEFAULT_CART_QUANTITY, MAX_CART_QUANTITY, nextCartQuantity, validateCartQuantity } from '../data/cartStorage.js'

const controlClass = 'h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-lime'

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('El archivo no es una imagen válida. Selecciona un PNG o JPG.'))
      image.onload = () => image.naturalWidth * image.naturalHeight > 20000000
        ? reject(new Error('La imagen tiene demasiados píxeles para editarla con fluidez. Reduce su resolución.'))
        : resolve({ dataUrl: reader.result, name: file.name, mimeType: file.type, width: image.naturalWidth, height: image.naturalHeight })
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function CustomizerContent({ product }) {
  const { inventory, error: inventoryError } = useInventory()
  const [config, setConfig] = useState(() => ({ ...defaultCustomization, color: initialPreviewColor(product), elements: [] }))
  const [selectedId, setSelectedId] = useState(null)
  const [quantity, setQuantity] = useState(DEFAULT_CART_QUANTITY)
  const [added, setAdded] = useState(false)
  const [message, setMessage] = useState(null)
  const [loadingImage, setLoadingImage] = useState(false)
  const [showPrintGuide, setShowPrintGuide] = useState(true)
  const uploadRef = useRef(null)
  const stageRef = useRef(null)
  const gesture = useRef(null)
  const selected = config.elements.find((element) => element.id === selectedId)
  const photo = photoPreviewFor(product, config.color)
  const extra = customizationCost(config)
  const unitPrice = Number((product.price + extra).toFixed(2))
  const lineTotal = cartTotals([{ price: unitPrice, quantity }]).total
  let reserved = 0
  let cartError = ''
  try {
    if (config.size) reserved = groupedVariants(getCart()).get(variantKey(product.id, config.color, config.size)) || 0
  } catch (error) { cartError = error.message }
  const available = config.size && inventory ? Math.max(0, stockFor(inventory, product.id, config.color, config.size) - reserved) : 0

  const update = (patch) => { setConfig((current) => ({ ...current, ...patch })); setMessage(null); setAdded(false) }
  const edit = (patch) => { setConfig((current) => ({ ...current, elements: updateElement(current.elements, selectedId, patch) })); setMessage(null); setAdded(false) }

  const adjustQuantity = (delta) => {
    try { setQuantity(nextCartQuantity(quantity, delta)); setMessage(null); setAdded(false) }
    catch (error) { setMessage({ type: 'error', text: error.message }) }
  }

  const handleImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    if (!['image/png', 'image/jpeg'].includes(file.type)) { setMessage({ type: 'error', text: 'Formato no permitido. Selecciona una imagen PNG o JPG.' }); return }
    if (file.size > 1024 * 1024) { setMessage({ type: 'error', text: 'La imagen supera 1 MB. Elige una más pequeña para poder guardarla en el navegador.' }); return }
    setLoadingImage(true)
    try {
      const element = createImage(await readImage(file))
      setConfig((current) => ({ ...current, elements: [...current.elements, element] }))
      setSelectedId(element.id); setMessage(null); setAdded(false)
    } catch (error) { setMessage({ type: 'error', text: error.message }) }
    finally { setLoadingImage(false) }
  }

  const addText = () => {
    const element = createText()
    setConfig((current) => ({ ...current, elements: [...current.elements, element] }))
    setSelectedId(element.id); setMessage(null); setAdded(false)
  }

  const reset = () => {
    setConfig({ ...defaultCustomization, color: initialPreviewColor(product), elements: [] })
    setSelectedId(null); setQuantity(DEFAULT_CART_QUANTITY); setAdded(false); setMessage(null)
    if (uploadRef.current) uploadRef.current.value = ''
  }

  // Pointer coordinates are converted from the current rendered stage to illustration units.
  const point = (event) => {
    const rect = stageRef.current.getBoundingClientRect()
    return stagePoint(event.clientX, event.clientY, rect)
  }
  const pointerDown = (event) => {
    const node = event.target.closest('[data-element-id]')
    if (!node) { setSelectedId(null); return }
    const element = config.elements.find((entry) => entry.id === node.dataset.elementId)
    if (!element) return
    event.preventDefault()
    setSelectedId(element.id)
    const start = point(event)
    gesture.current = { element, start, action: event.target.closest('[data-action]')?.dataset.action || 'move' }
    stageRef.current.setPointerCapture(event.pointerId)
  }
  const pointerMove = (event) => {
    const active = gesture.current
    if (!active) return
    const current = point(event)
    const { element, start, action } = active
    let patch
    if (action === 'move') patch = moveElement(element, start, current)
    else if (action === 'rotate') patch = { rotation: rotateElement(element, start, current) }
    else {
      const radians = element.rotation * Math.PI / 180
      const dx = current.x - start.x; const dy = current.y - start.y
      const width = element.width + dx * Math.cos(radians) + dy * Math.sin(radians)
      const height = element.height - dx * Math.sin(radians) + dy * Math.cos(radians)
      patch = resizeElement(element, width, height)
    }
    setConfig((state) => ({ ...state, elements: updateElement(state.elements, element.id, patch) }))
    setAdded(false); setMessage(null)
  }
  const pointerUp = () => { gesture.current = null }

  const exportDesign = () => {
    const data = { productId: product.id, name: product.name, color: config.color, size: config.size, quantity, price: unitPrice, elements: config.elements }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `trama-${product.id}.json`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const addToCart = () => {
    if (added) return
    if (inventoryError || cartError) { setMessage({ type: 'error', text: inventoryError || cartError }); return }
    if (config.size && quantity > available) { setMessage({ type: 'error', text: `Stock insuficiente para ${product.name} · ${config.color} · ${config.size}: quedan ${available} unidades para agregar.` }); return }
    try {
      const latest = getActiveProduct(product.id)
      if (!latest) { setMessage({ type: 'error', text: 'Esta camiseta ya no está disponible. Tu diseño permanece aquí para que puedas exportarlo.' }); return }
      if (latest.price !== product.price || latest.name !== product.name || !latest.colors.includes(config.color) || !latest.sizes.includes(config.size)) {
        setMessage({ type: 'error', text: 'La camiseta cambió mientras la editabas. Revisa su precio y opciones antes de continuar; tu diseño sigue aquí.' })
        return
      }
    } catch (error) { setMessage({ type: 'error', text: error.message }); return }
    if (!config.size) { setMessage({ type: 'error', text: 'Selecciona una talla antes de agregar la camiseta al carrito.' }); document.getElementById('tallas')?.focus(); return }
    try { validateCartQuantity(quantity) } catch (error) { setMessage({ type: 'error', text: error.message }); return }
    const item = { id: crypto.randomUUID(), productId: product.id, name: product.name, price: unitPrice, basePrice: product.price, customizationPrice: extra, size: config.size, color: config.color, previewMode: photo ? 'photo-v1' : 'illustration', productSnapshot: { id: product.id, name: product.name, image: product.image, imageAlt: product.imageAlt, background: product.background, colors: [...product.colors] }, elements: config.elements.map((element) => ({ ...element })), quantity }
    try { addCartItem(item); setAdded(true); setMessage({ type: 'success', text: '¡Camiseta agregada al carrito!' }) }
    catch (error) { setMessage({ type: 'error', text: `${error.message} Tu diseño sigue aquí; puedes exportarlo.` }) }
  }

  return <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 lg:px-10 lg:pt-14">
    <Link to="/catalogo" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-ink/60 hover:text-ink"><ArrowLeft size={17} /> Volver al catálogo</Link>
    <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#63832c]">Tu espacio creativo</p><h1 className="font-display text-4xl font-extrabold tracking-[-0.055em] text-ink sm:text-5xl">Hazla tuya<span className="text-[#8eaf4a]">.</span></h1><p className="mt-2 text-sm text-ink/60">Personaliza {product.name} y mira los cambios al instante.</p></div>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-10">
      <div className="min-w-0 lg:sticky lg:top-6">
        <div className={`relative rounded-[28px] ${product.background}`} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
          <ShirtPreview product={product} customization={config} stageRef={stageRef} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={pointerDown} showPrintGuide={showPrintGuide} presentation="photo" />
          <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-ink sm:bottom-6 sm:left-6"><Sparkles size={14} className="mr-1 inline" /> Vista previa en vivo</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-ink/60"><span>Arrastra, gira o redimensiona sobre la camiseta.</span><button type="button" aria-pressed={showPrintGuide} onClick={() => setShowPrintGuide((visible) => !visible)} className="font-bold text-ink underline underline-offset-4">{showPrintGuide ? 'Ocultar guía imprimible' : 'Mostrar guía imprimible'}</button></div>
        {!photo && <p className="mt-2 text-center text-xs text-ink/60">Vista ilustrativa: no hay una fotografía alineada para este color y producto.</p>}
        {config.elements.some((element) => isOutsidePrint(element, photo?.printZone)) && <p role="status" className="mt-2 rounded-xl bg-[#fce9e5] px-4 py-3 text-sm font-semibold text-[#873c2e]">Atención: hay elementos fuera de la zona imprimible; ajústalos antes de imprimir.</p>}
      </div>
      <div className="min-w-0 space-y-5">
        <section className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-ink/50">{product.category}</p><h2 className="font-display text-2xl font-bold text-ink">{product.name}</h2></div><strong className="whitespace-nowrap text-lg text-ink">{formatPrice(product.price)}</strong></div>
          <div className="mt-6 border-t border-ink/10 pt-5"><h3 className="mb-3 text-sm font-bold text-ink">1. Elige tu color <span className="font-normal text-ink/50">· {config.color}</span></h3><ColorChoices options={product.colors.map((color) => ({ name: color, value: color }))} selected={config.color} onSelect={(color) => update({ color })} /></div>
          <fieldset id="tallas" tabIndex="-1" className="mt-6 border-t border-ink/10 pt-5 outline-none"><legend className="sr-only">Selecciona una talla</legend><h3 className="mb-3 text-sm font-bold text-ink">2. Selecciona una talla <span className="font-normal text-ink/50">· obligatorio</span></h3><div className="flex flex-wrap gap-2">{product.sizes.map((size) => <button key={size} type="button" aria-pressed={config.size === size} onClick={() => update({ size })} className={`h-11 min-w-12 rounded-xl border px-3 text-sm font-bold ${config.size === size ? 'border-ink bg-ink text-white' : 'border-ink/15 bg-white text-ink hover:border-ink'}`}>{size}</button>)}</div></fieldset>
          {config.size && <p role="status" className={`mt-3 text-sm font-semibold ${available ? 'text-[#537027]' : 'text-[#873c2e]'}`}>{inventoryError || cartError || `${available} unidades disponibles para ${config.color} · ${config.size}${reserved ? ` (${reserved} reservadas en tu carrito)` : ''}`}</p>}
        </section>
        <section className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
          <h2 className="font-display text-xl font-bold text-ink">3. Diseña tu camiseta</h2><p className="mt-1 text-xs text-ink/50">Texto + {formatPrice(2)} · Imagen + {formatPrice(3)} (por tipo de personalización). {photo ? 'La fotografía conserva su estampado original bajo tus elementos.' : 'El diseño original se reemplaza al añadir elementos.'}</p>
          <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={addText} className="h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white">+ Agregar texto</button><label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-ink/25 px-4 text-sm font-bold text-ink focus-within:ring-2 focus-within:ring-lime"><ImagePlus size={18} /> {loadingImage ? 'Cargando…' : 'Agregar imagen'}<input ref={uploadRef} type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={handleImage} disabled={loadingImage} aria-label="Cargar imagen PNG o JPG" className="sr-only" /></label></div>
          <p className="mt-2 text-xs text-ink/50">PNG o JPG · máximo 1 MB por imagen. Las imágenes se guardan en este navegador.</p>
          <h3 className="mt-6 text-sm font-bold text-ink">Capas ({config.elements.length})</h3>
          <div className="mt-2 max-h-52 space-y-2 overflow-y-auto">{[...config.elements].reverse().map((element) => <button key={element.id} type="button" onClick={() => setSelectedId(element.id)} aria-pressed={selectedId === element.id} className={`block w-full truncate rounded-xl border px-3 py-2 text-left text-sm ${selectedId === element.id ? 'border-[#64842d] bg-[#e8ece0] font-bold' : 'border-ink/10'}`}>{element.type === 'text' ? `Texto: ${element.content}` : `Imagen: ${element.name || 'cargada'}`}{isOutsidePrint(element, photo?.printZone) ? ' · Fuera de zona' : ''}</button>)}</div>
          {selected && <div className="mt-5 space-y-4 border-t border-ink/10 pt-5"><h3 className="font-bold text-ink">Editar {selected.type === 'text' ? 'texto' : 'imagen'}</h3>
            {selected.type === 'text' && <><label className="block text-xs font-semibold text-ink/70">Contenido<input type="text" value={selected.content} onChange={(event) => edit({ content: event.target.value })} className={`mt-2 ${controlClass}`} /></label><label className="block text-xs font-semibold text-ink/70">Tipografía<select value={selected.font} onChange={(event) => edit({ font: event.target.value })} className={`mt-2 ${controlClass}`}>{fonts.map((font) => <option key={font.name} value={font.value}>{font.name}</option>)}</select></label><div><p className="mb-2 text-xs font-semibold text-ink/70">Color del texto</p><ColorChoices options={printColors} selected={selected.color} onSelect={(color) => edit({ color })} /></div></>}
            {selected.type === 'image' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.lockAspect} onChange={(event) => edit({ lockAspect: event.target.checked })} /> Mantener proporción</label>}
            <div className="grid grid-cols-2 gap-3">{['x', 'y'].map((axis) => <label key={axis} className="text-xs font-semibold text-ink/70">Posición {axis.toUpperCase()}<input type="number" step="any" value={Math.round(selected[axis] * 100) / 100} onChange={(event) => edit({ [axis]: Number(event.target.value) })} className={`mt-2 ${controlClass}`} /></label>)}
              {['width', 'height'].map((axis) => <label key={axis} className="text-xs font-semibold text-ink/70">{axis === 'width' ? 'Ancho' : 'Alto'}<input type="number" min="1" step="any" value={Math.round(selected[axis] * 100) / 100} onChange={(event) => { const value = Number(event.target.value); if (value <= 0 || !Number.isFinite(value)) return; const patch = axis === 'width' ? resizeElement(selected, value, selected.height) : { width: selected.type === 'image' && selected.lockAspect ? value * selected.width / selected.height : selected.width, height: value }; edit(patch) }} className={`mt-2 ${controlClass}`} /></label>)}
            </div><label className="block text-xs font-semibold text-ink/70">Rotación (grados)<input type="number" step="any" value={Math.round(selected.rotation * 100) / 100} onChange={(event) => edit({ rotation: Number(event.target.value) })} className={`mt-2 ${controlClass}`} /></label>
            <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-4">{[[ArrowUp, 'Al frente', () => update({ elements: reorderElement(config.elements, selectedId, true) })], [ArrowDown, 'Al fondo', () => update({ elements: reorderElement(config.elements, selectedId, false) })], [Copy, 'Duplicar', () => { const next = duplicateElement(config.elements, selectedId); update({ elements: next }); setSelectedId(next.find((entry) => !config.elements.includes(entry))?.id) }], [Trash2, 'Eliminar', () => { update({ elements: config.elements.filter((entry) => entry.id !== selectedId) }); setSelectedId(null) }]].map(([Icon, label, action]) => <button key={label} type="button" onClick={action} className="inline-flex h-10 items-center gap-1 rounded-xl border border-ink/15 px-3 text-xs font-bold text-ink hover:bg-paper"><Icon size={15} /> {label}</button>)}</div>
          </div>}
        </section>
        <section className="rounded-[22px] bg-[#e8ece0] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4"><h2 className="font-display text-xl font-bold text-ink">Resumen</h2><button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/65 hover:text-ink"><RotateCcw size={15} /> Restablecer</button></div>
          <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt>Producto</dt><dd className="text-right font-semibold">{product.name}</dd></div><div className="flex justify-between gap-3"><dt>Talla / Color</dt><dd className="text-right font-semibold">{config.size || 'Sin seleccionar'} / {config.color}</dd></div><div className="flex justify-between gap-3"><dt>Precio base</dt><dd className="font-semibold">{formatPrice(product.price)}</dd></div><div className="flex justify-between gap-3"><dt>Personalización ({config.elements.length} elementos)</dt><dd className="font-semibold">{formatPrice(extra)}</dd></div></dl>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/20 pt-5"><div><p className="text-sm font-bold text-ink">Cantidad</p><p className="text-xs text-ink/55">Máximo {MAX_CART_QUANTITY} unidades por artículo, sujeto al stock disponible</p></div><div className="inline-flex items-center rounded-full border border-ink/20 bg-white"><button type="button" aria-label="Disminuir cantidad" onClick={() => adjustQuantity(-1)} disabled={quantity <= 1} className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-30"><Minus size={17} /></button><span className="min-w-9 text-center text-sm font-bold" aria-live="polite">{quantity}</span><button type="button" aria-label="Aumentar cantidad" onClick={() => adjustQuantity(1)} disabled={quantity >= MAX_CART_QUANTITY || (config.size && quantity >= available)} className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-30"><Plus size={17} /></button></div></div>
          <div className="mt-5 flex justify-between text-sm"><span>Precio unitario</span><span className="font-bold">{formatPrice(unitPrice)}</span></div><div className="mt-5 flex justify-between border-t border-ink/20 pt-5 font-display text-xl font-bold"><span>Total ({quantity})</span><span>{formatPrice(lineTotal)}</span></div>
          <Button type="button" onClick={addToCart} disabled={loadingImage || added || Boolean(config.size && (available < quantity || inventoryError || cartError))} className="mt-6 w-full disabled:opacity-50"><ShoppingBag size={18} /> {added ? 'Agregado al carrito' : 'Agregar al carrito'}</Button>
          <button type="button" onClick={exportDesign} className="mt-3 w-full text-sm font-bold text-ink underline underline-offset-4">Exportar diseño (JSON)</button>
          {message && <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'bg-[#fce9e5] text-[#873c2e]' : 'bg-[#d9eec3] text-ink'}`}>{message.text}{message.type === 'success' && <Link to="/carrito" className="ml-2 underline underline-offset-4">Ver carrito →</Link>}</p>}
        </section>
      </div>
    </div>
  </div>
}

export default function Customizer() {
  const [searchParams] = useSearchParams()
  const { products: allProducts, error } = useProducts()
  const lastVisible = useRef({ route: null, product: null })
  const productId = searchParams.get('producto')
  const products = publicProducts(allProducts)
  const route = productId || 'default'
  if (lastVisible.current.route !== route) lastVisible.current = { route, product: null }
  const available = productId ? products.find((item) => item.id === productId) : lastVisible.current.product
    ? products.find((item) => item.id === lastVisible.current.product.id) : products[0]
  if (available) lastVisible.current.product = available
  const product = available || lastVisible.current.product
  if (error) return <section role="alert" className="mx-auto max-w-7xl px-5 py-24 text-center text-[#873c2e]">{error}</section>
  if (!product) return <section className="mx-auto max-w-7xl px-5 py-24 text-center"><h1 className="font-display text-3xl font-bold text-ink">No encontramos esa camiseta.</h1><p className="mt-3 text-ink/60">Elige un producto disponible para empezar a personalizar.</p><Button to="/catalogo" className="mt-6">Ver catálogo</Button></section>
  return <>{!available && <p role="alert" className="mx-auto mt-5 max-w-7xl rounded-xl bg-[#fce9e5] p-4 text-sm font-semibold text-[#873c2e]">Esta camiseta fue desactivada. No puedes comprarla, pero puedes conservar o exportar el diseño que estabas editando.</p>}<CustomizerContent key={product.id} product={product} /></>
}
