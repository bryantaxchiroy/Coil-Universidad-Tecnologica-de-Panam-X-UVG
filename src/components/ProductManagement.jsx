import { useState } from 'react'
import { ImagePlus, PackagePlus, Search, X } from 'lucide-react'
import { products as starterProducts, formatPrice } from '../data/products.js'
import { shirtColors } from '../data/customization.js'
import { saveProduct, setProductActive } from '../data/productStorage.js'
import useProducts from '../hooks/useProducts.js'
import { setProductInitialStock } from '../data/inventoryStorage.js'
import { getCart } from '../data/cartStorage.js'
import { getOrders } from '../data/orderStorage.js'

const inputClass = 'mt-2 h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-lime'
const emptyForm = () => ({ name: '', description: '', price: '', category: '', colors: '', sizes: '', image: starterProducts[0].image, active: true, initialStock: 0 })
const list = (text) => [...new Set(text.split(',').map((entry) => entry.trim()).filter(Boolean))]

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 500 * 1024) {
      reject(new Error('Usa PNG o JPG de máximo 500 KB para guardar la imagen en este navegador.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('El archivo no contiene una imagen válida.'))
      image.onload = () => resolve(reader.result)
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function ProductManagement() {
  const { products, error } = useProducts()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const categories = [...new Set(products.map((product) => product.category))]
  const visible = products.filter((product) =>
    product.name.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')) &&
    (!category || product.category === category) &&
    (!status || (status === 'activo' ? product.active !== false : product.active === false)),
  )
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const startEdit = (product) => {
    setEditingId(product.id)
    setForm({ ...product, colors: product.colors.join(', '), sizes: product.sizes.join(', ') })
    setMessage(null)
  }
  const submit = (event) => {
    event.preventDefault()
    try {
      const colors = list(form.colors)
      const sizes = list(form.sizes)
      const previous = products.find((entry) => entry.id === editingId)
      const removed = previous && [...getCart(), ...getOrders().flatMap((order) => order.items)].some((item) =>
        item.productId === editingId && previous.colors.includes(item.color) && previous.sizes.includes(item.size) &&
        (!colors.includes(item.color) || !sizes.includes(item.size)))
      const product = saveProduct({ ...form, id: editingId || undefined, editing: Boolean(editingId), colors, sizes })
      if (!editingId && Number(form.initialStock) > 0) {
        try { setProductInitialStock(product.id, Number(form.initialStock)) }
        catch (error) {
          setEditingId(product.id)
          setMessage({ type: 'error', text: `Producto guardado, pero no se pudieron inicializar sus existencias: ${error.message} Ajusta el inventario antes de venderlo.` })
          return
        }
      }
      setForm(null); setEditingId(null)
      setMessage({ type: 'success', text: `Producto «${product.name}» guardado correctamente.${removed ? ' Algunas variantes retiradas aparecen en carritos o pedidos: los pedidos históricos se conservaron y los carritos afectados deberán ajustarse antes de comprar.' : ''}` })
    } catch (caught) { setMessage({ type: 'error', text: caught.message }) }
  }
  const toggle = (product) => {
    try {
      setProductActive(product.id, product.active === false)
      setMessage({ type: 'success', text: `«${product.name}» ${product.active === false ? 'activado' : 'desactivado'}.` })
    } catch (caught) { setMessage({ type: 'error', text: caught.message }) }
  }
  const upload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    try { change('image', await readImage(file)); setMessage(null) }
    catch (caught) { setMessage({ type: 'error', text: caught.message }) }
    finally { setUploading(false) }
  }

  return <section id="productos-admin" className="mt-10 rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#63832c]">Catálogo administrativo</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">Productos</h2></div><button type="button" onClick={() => { setForm(emptyForm()); setEditingId(null); setMessage(null) }} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white"><PackagePlus size={18} /> Agregar producto</button></div>
    <p className="mt-2 text-xs text-ink/55">Los cambios se guardan solo en este navegador. Los productos desactivados permanecen visibles aquí.</p>
    {error && <p role="alert" className="mt-5 rounded-xl bg-[#fce9e5] p-4 text-sm text-[#873c2e]">{error}</p>}
    {message && <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-xl p-4 text-sm font-semibold ${message.type === 'error' ? 'bg-[#fce9e5] text-[#873c2e]' : 'bg-[#d9eec3] text-ink'}`}>{message.text}</p>}
    {form && <form onSubmit={submit} className="mt-6 rounded-[22px] bg-paper p-5 sm:p-7">
      <div className="flex items-center justify-between"><h3 className="font-display text-xl font-bold">{editingId ? 'Editar producto' : 'Nuevo producto'}</h3><button type="button" aria-label="Cerrar formulario" onClick={() => { setForm(null); setEditingId(null) }}><X size={20} /></button></div>
      {editingId && <p className="mt-1 text-xs text-ink/55">Identificador estable: {editingId}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold">Nombre *<input required value={form.name} onChange={(event) => change('name', event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-bold">Precio (USD) *<input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => change('price', event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-bold sm:col-span-2">Descripción *<textarea required value={form.description} onChange={(event) => change('description', event.target.value)} rows="2" className={`${inputClass} h-auto py-3`} /></label>
        <label className="text-xs font-bold">Categoría *<input required value={form.category} onChange={(event) => change('category', event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-bold">Colores disponibles *<input required value={form.colors} onChange={(event) => change('colors', event.target.value)} placeholder="Negro, Blanco, Crema" className={inputClass} /><span className="mt-1 block font-normal text-ink/55">Paleta: {Object.keys(shirtColors).join(', ')}</span></label>
        <label className="text-xs font-bold">Tallas disponibles *<input required value={form.sizes} onChange={(event) => change('sizes', event.target.value)} placeholder="S, M, L, XL" className={inputClass} /></label>
        {!editingId && <label className="text-xs font-bold">Existencias iniciales por variante<input type="number" min="0" step="1" value={form.initialStock} onChange={(event) => change('initialStock', event.target.value)} className={inputClass} /><span className="mt-1 block font-normal text-ink/55">Se asigna a cada combinación de color y talla.</span></label>}
        <label className="text-xs font-bold">Imagen existente *<select value={starterProducts.some((product) => product.image === form.image) ? form.image : 'uploaded'} onChange={(event) => change('image', event.target.value)} className={inputClass}>{starterProducts.map((product) => <option key={product.id} value={product.image}>{product.name}</option>)}{!starterProducts.some((product) => product.image === form.image) && <option value="uploaded">Imagen cargada</option>}</select></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink/20 bg-white px-4 py-3 text-xs font-bold focus-within:ring-2 focus-within:ring-lime"><ImagePlus size={17} /> {uploading ? 'Cargando…' : 'Cargar PNG/JPG (máx. 500 KB)'}<input type="file" accept="image/png,image/jpeg" onChange={upload} disabled={uploading} aria-label="Cargar imagen del producto" className="sr-only" /></label>
        {form.image && <img src={form.image} alt="Vista previa del producto" className="h-16 w-16 rounded-xl bg-[#e8ece0] object-contain" />}
      </div>
      <label className="mt-5 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.active} onChange={(event) => change('active', event.target.checked)} /> Producto activo</label>
      <button type="submit" disabled={uploading || Boolean(error)} className="mt-5 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white disabled:opacity-50">Guardar producto</button>
    </form>}
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <label className="text-xs font-semibold">Buscar por nombre<div className="relative"><Search size={17} className="absolute left-3 top-5 text-ink/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} pl-10`} /></div></label>
      <label className="text-xs font-semibold">Categoría<select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}><option value="">Todas</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="text-xs font-semibold">Disponibilidad<select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option></select></label>
    </div>
    {visible.length ? <div className="mt-6 grid gap-3 md:grid-cols-2">{visible.map((product) => <article key={product.id} className="flex gap-4 rounded-2xl border border-ink/10 p-4"><img src={product.image} alt={product.imageAlt || product.name} className="h-24 w-24 shrink-0 rounded-xl bg-[#e8ece0] object-contain" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display font-bold">{product.name}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${product.active === false ? 'bg-[#fce9e5] text-[#873c2e]' : 'bg-[#e8ece0] text-[#537027]'}`}>{product.active === false ? 'Inactivo' : 'Activo'}</span></div><p className="mt-1 text-xs text-ink/60">{product.category} · {formatPrice(product.price)}</p><div className="mt-3 flex flex-wrap gap-3 text-xs font-bold"><button type="button" onClick={() => startEdit(product)} className="text-[#537027] underline underline-offset-4">Editar</button><button type="button" onClick={() => toggle(product)} className="text-ink underline underline-offset-4">{product.active === false ? 'Activar' : 'Desactivar'}</button></div></div></article>)}</div> : !error && <p role="status" className="mt-6 rounded-xl bg-paper p-5 text-sm text-ink/60">No hay productos que coincidan con los filtros.</p>}
  </section>
}
