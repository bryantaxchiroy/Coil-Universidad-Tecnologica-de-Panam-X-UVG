import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, CircleCheck, Clock3, Factory, Search, Wallet } from 'lucide-react'
import OrderItems from '../components/OrderItems.jsx'
import OrderProgress from '../components/OrderProgress.jsx'
import ProductManagement from '../components/ProductManagement.jsx'
import InventoryManagement from '../components/InventoryManagement.jsx'
import { formatPrice } from '../data/products.js'
import { filterOrders, getOrders, nextOrderStatus, orderIndicators, orderStages, subscribeOrders, updateOrderStatus } from '../data/orderStorage.js'

const dateLabel = (value) => new Intl.DateTimeFormat('es-PA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const statuses = [...new Set([...orderStages('retiro'), ...orderStages('envio')])]

export default function Administration() {
  const [revision, setRevision] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [message, setMessage] = useState(null)
  useEffect(() => subscribeOrders(() => { setRevision((current) => current + 1); setMessage(null) }), [])

  let orders = []
  let error = ''
  try { orders = getOrders() } catch (caught) { error = caught.message }
  const selected = orders.find((order) => order.id === selectedId)
  const visible = filterOrders(orders, { query, status })
  const indicators = orderIndicators(orders)
  const cards = [
    { label: 'Total de pedidos', value: indicators.total, icon: ClipboardList },
    { label: 'Pedidos pagados', value: indicators.paid, icon: Wallet },
    { label: 'En producción', value: indicators.production, icon: Factory },
    { label: 'Completados', value: indicators.completed, icon: CircleCheck },
    { label: 'Ingresos simulados', value: formatPrice(indicators.revenue), icon: Clock3 },
  ]
  const advance = () => {
    if (!selected) return
    try {
      const updated = updateOrderStatus(selected.id, nextOrderStatus(selected))
      setMessage({ type: 'success', text: `Pedido ${updated.id} actualizado a «${updated.status}».` })
    } catch (caught) { setMessage({ type: 'error', text: caught.message }) }
  }

  return <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8 lg:px-10 lg:pt-14">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#63832c]">Administración — Modo demostración</p>
    <h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.055em] text-ink sm:text-5xl">Pedidos en movimiento<span className="text-[#8eaf4a]">.</span></h1>
    <p role="note" className="mt-5 rounded-2xl border border-[#d6c89d] bg-[#fbf4dc] px-5 py-4 text-sm leading-6 text-ink">Este panel es público en el prototipo. No utilices información real: no hay autenticación ni servidor y los datos solo existen en este navegador.</p>
    <nav aria-label="Secciones administrativas" className="mt-7 flex flex-wrap gap-3 text-sm font-bold">
      {[['indicadores', 'Resumen'], ['pedidos-admin', 'Pedidos'], ['productos-admin', 'Productos'], ['inventario-admin', 'Inventario']].map(([id, label], index) =>
        <button key={id} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })} className={`rounded-full px-5 py-2.5 ${index === 0 ? 'bg-ink text-white' : 'border border-ink/20 text-ink'}`}>{label}</button>)}
    </nav>
    {error && <p role="alert" className="mt-6 rounded-xl bg-[#fce9e5] p-4 text-sm font-semibold text-[#873c2e]">{error}</p>}
    <section id="indicadores" aria-label="Indicadores de pedidos" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-[22px] border border-ink/10 bg-white p-5"><Icon size={21} className="text-[#63832c]" /><p className="mt-5 text-xs font-semibold text-ink/60">{label}</p><p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p></div>)}
    </section>
    <section id="pedidos-admin" className="mt-10 rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#63832c]">Gestión</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">Pedidos</h2></div><p className="text-sm text-ink/60">{visible.length} de {orders.length} pedidos</p></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="text-xs font-semibold text-ink/70">Buscar por identificador<div className="relative mt-2"><Search size={17} className="pointer-events-none absolute left-3 top-3 text-ink/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="TRM-..." className="h-11 w-full rounded-xl border border-ink/15 bg-white pl-10 pr-3 text-sm outline-none focus:border-ink" /></div></label>
        <label className="text-xs font-semibold text-ink/70">Filtrar por estado<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm"><option value="">Todos los estados</option>{statuses.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label>
      </div>
      {visible.length ? <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/50"><tr>{['Pedido', 'Fecha', 'Cliente', 'Camisetas', 'Total', 'Estado', ''].map((label) => <th key={label} scope="col" className="px-3 py-3 font-bold">{label}</th>)}</tr></thead><tbody className="divide-y divide-ink/10">{visible.map((order) => <tr key={order.id} className={selectedId === order.id ? 'bg-[#f1f4e9]' : ''}><td className="px-3 py-4 font-semibold">{order.id}</td><td className="whitespace-nowrap px-3 py-4">{dateLabel(order.createdAt)}</td><td className="px-3 py-4">{order.customer?.fullName || 'Sin nombre'}</td><td className="px-3 py-4">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td className="px-3 py-4">{formatPrice(order.total)}</td><td className="px-3 py-4"><span className="inline-block whitespace-nowrap rounded-full bg-[#e8ece0] px-3 py-1 text-xs font-bold">{order.status}</span></td><td className="px-3 py-4"><button type="button" onClick={() => { setSelectedId(order.id); setMessage(null) }} className="font-bold text-[#537027] underline underline-offset-4">Ver detalles</button></td></tr>)}</tbody></table></div> : !error && <p role="status" className="mt-6 rounded-xl bg-paper p-5 text-sm text-ink/60">{orders.length ? 'No hay pedidos que coincidan con la búsqueda o el filtro.' : 'Aún no hay pedidos en este navegador. Confirma una compra de demostración para verla aquí.'}</p>}
    </section>
    {selected && <section aria-label={`Detalle del pedido ${selected.id}`} className="mt-8 space-y-5">
      <div className="rounded-[22px] bg-[#e8ece0] p-5 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#63832c]">Detalle del pedido</p><h2 className="mt-2 break-all font-display text-2xl font-bold">{selected.id}</h2><p className="mt-2 text-sm text-ink/60">{dateLabel(selected.createdAt)}</p></div><button type="button" onClick={() => { setSelectedId(null); setMessage(null) }} className="text-sm font-bold underline underline-offset-4">Cerrar detalle</button></div><div className="mt-6 border-t border-ink/15 pt-6"><OrderProgress order={selected} /></div></div>
      <div className="grid gap-5 md:grid-cols-2"><div className="rounded-[22px] border border-ink/10 bg-white p-5 text-sm sm:p-7"><h3 className="font-display text-xl font-bold">Cliente y entrega</h3><p className="mt-4 font-semibold">{selected.customer?.fullName || 'Sin nombre'}</p><p className="mt-1 text-ink/60">{selected.customer?.email || 'Sin correo'} · {selected.customer?.phone || 'Sin teléfono'}</p><p className="mt-4">{selected.delivery.method === 'retiro' ? 'Retiro en tienda' : 'Envío'}</p>{selected.delivery.method === 'envio' && <p className="mt-1 text-ink/60">{selected.delivery.address}</p>}</div><div className="rounded-[22px] border border-ink/10 bg-white p-5 text-sm sm:p-7"><h3 className="font-display text-xl font-bold">Historial de estado</h3><ol className="mt-4 space-y-3">{(selected.statusHistory?.length ? selected.statusHistory : [{ status: 'Pagado', at: selected.createdAt }]).map((entry, index) => <li key={`${entry.at}-${index}`} className="flex justify-between gap-3"><span className="font-semibold">{entry.status}</span><time dateTime={entry.at} className="text-right text-ink/60">{dateLabel(entry.at)}</time></li>)}</ol>{nextOrderStatus(selected) ? <button type="button" onClick={advance} className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-[#3a413a]">Avanzar a {nextOrderStatus(selected)}</button> : <p className="mt-5 font-semibold text-[#537027]">Pedido entregado · sin más transiciones</p>}{message && <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-xl p-3 font-semibold ${message.type === 'error' ? 'bg-[#fce9e5] text-[#873c2e]' : 'bg-[#d9eec3] text-ink'}`}>{message.text}</p>}</div></div>
      <div className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-8"><h3 className="mb-5 font-display text-xl font-bold">Productos y personalizaciones</h3><OrderItems items={selected.items} showUnitPrice /><div className="mt-6 flex justify-between border-t border-ink/15 pt-5 font-display text-xl font-bold"><span>Total</span><span>{formatPrice(selected.total)}</span></div><Link to={`/seguimiento?pedido=${encodeURIComponent(selected.id)}`} className="mt-5 inline-block text-sm font-bold text-[#537027] underline underline-offset-4">Ver seguimiento del cliente</Link></div>
    </section>}
    <ProductManagement />
    <InventoryManagement />
  </div>
}
