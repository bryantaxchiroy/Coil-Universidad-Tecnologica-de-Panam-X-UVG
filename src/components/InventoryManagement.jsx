import { useState } from 'react'
import { Boxes, Search } from 'lucide-react'
import { inventoryIndicators, LOW_STOCK_THRESHOLD, setVariantStock, stockFor } from '../data/inventoryStorage.js'
import useInventory from '../hooks/useInventory.js'
import useProducts from '../hooks/useProducts.js'

export default function InventoryManagement() {
  const { products, error: productError } = useProducts()
  const { inventory, error: inventoryError } = useInventory()
  const [query, setQuery] = useState('')
  const [availability, setAvailability] = useState('')
  const [drafts, setDrafts] = useState({})
  const [message, setMessage] = useState(null)
  const stats = inventory ? inventoryIndicators(products, inventory) : null
  const visible = products.filter((product) => {
    if (!inventory) return false
    if (!product.name.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))) return false
    const amounts = product.colors.flatMap((color) => product.sizes.map((size) => stockFor(inventory, product.id, color, size)))
    return !availability || (availability === 'agotado' ? amounts.every((amount) => amount === 0) : availability === 'bajo' ? amounts.some((amount) => amount > 0 && amount <= LOW_STOCK_THRESHOLD) : amounts.some((amount) => amount > 0))
  })
  const save = (product, color, size, value) => {
    try {
      const amount = Number(value)
      setVariantStock(product.id, color, size, amount)
      setMessage({ type: 'success', text: `${product.name} · ${color} · ${size}: ${amount} unidades guardadas.` })
      setDrafts((current) => { const next = { ...current }; delete next[JSON.stringify([product.id, color, size])]; return next })
    } catch (error) { setMessage({ type: 'error', text: error.message }) }
  }
  return <section id="inventario-admin" className="mt-10 rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
    <div className="flex items-center gap-3"><Boxes size={23} className="text-[#63832c]" /><div><p className="text-xs font-bold uppercase tracking-widest text-[#63832c]">Existencias por variante</p><h2 className="font-display text-2xl font-bold">Inventario</h2></div></div>
    <p className="mt-2 text-xs text-ink/55">Stock inicial de demostración: 20 unidades por variante original, descontando pedidos históricos. Las variantes nuevas comienzan en cero. Stock bajo: 1–{LOW_STOCK_THRESHOLD} unidades.</p>
    {(inventoryError || productError) && <p role="alert" className="mt-4 rounded-xl bg-[#fce9e5] p-4 text-sm text-[#873c2e]">{inventoryError || productError}</p>}
    {message && <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-xl p-4 text-sm font-semibold ${message.type === 'error' ? 'bg-[#fce9e5] text-[#873c2e]' : 'bg-[#d9eec3] text-ink'}`}>{message.text}</p>}
    {stats && <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Unidades disponibles', stats.available], ['Variantes agotadas', stats.soldOut], ['Stock bajo', stats.low], ['Productos activos', stats.activeProducts]].map(([label, value]) => <div key={label} className="rounded-xl bg-[#e8ece0] p-4"><p className="text-xs text-ink/60">{label}</p><strong className="mt-2 block font-display text-2xl">{value}</strong></div>)}</div>}
    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
      <label className="text-xs font-bold">Buscar producto<div className="relative"><Search size={17} className="absolute left-3 top-5 text-ink/40" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-ink/15 bg-white pl-10 pr-3 text-sm" /></div></label>
      <label className="text-xs font-bold">Disponibilidad<select value={availability} onChange={(event) => setAvailability(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm"><option value="">Todas</option><option value="disponible">Con stock</option><option value="agotado">Agotados</option><option value="bajo">Stock bajo</option></select></label>
    </div>
    {inventory && <div className="mt-6 space-y-4">{visible.map((product) => <div key={product.id} className="rounded-2xl border border-ink/10 p-4 sm:p-5"><h3 className="font-display text-lg font-bold">{product.name} <span className="text-xs font-normal text-ink/50">{product.active === false ? '· Inactivo' : ''}</span></h3><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{product.colors.flatMap((color) => product.sizes.map((size) => {
      const key = JSON.stringify([product.id, color, size])
      const amount = stockFor(inventory, product.id, color, size)
      const value = drafts[key] ?? String(amount)
      return <form key={key} onSubmit={(event) => { event.preventDefault(); save(product, color, size, value) }} className="rounded-xl bg-paper p-3"><label className="text-xs font-bold">{color} · {size}<input type="number" min="0" step="1" value={value} onChange={(event) => setDrafts((current) => ({ ...current, [key]: event.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-ink/15 bg-white px-3 text-sm" /></label><div className="mt-2 flex items-center justify-between gap-2"><span className={`text-xs font-bold ${amount === 0 ? 'text-[#873c2e]' : amount <= LOW_STOCK_THRESHOLD ? 'text-[#8b6119]' : 'text-[#537027]'}`}>{amount === 0 ? 'Agotado' : amount <= LOW_STOCK_THRESHOLD ? 'Stock bajo' : 'Disponible'}</span><button type="submit" disabled={value === String(amount)} className="text-xs font-bold text-ink underline underline-offset-4 disabled:opacity-40">Guardar</button></div></form>
    }))}</div></div>)}{!visible.length && <p className="rounded-xl bg-paper p-5 text-sm text-ink/60">No hay productos con esta disponibilidad.</p>}</div>}
  </section>
}
