import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import OrderDetails from '../components/OrderDetails.jsx'
import { findOrder, subscribeOrders } from '../data/orderStorage.js'

function lookup(id) {
  if (!id) return { order: null, error: '' }
  try { return { order: findOrder(id), error: '' } }
  catch (caught) { return { order: null, error: caught.message } }
}

export default function Tracking() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchId = searchParams.get('pedido')?.trim() || ''
  const [input, setInput] = useState(searchId)
  const [, setRevision] = useState(0)
  useEffect(() => subscribeOrders(() => setRevision((current) => current + 1)), [])
  const { order, error } = lookup(searchId)
  const submit = (event) => { event.preventDefault(); setSearchParams(input.trim() ? { pedido: input.trim() } : {}) }

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-12 sm:px-8 lg:pt-18">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#63832c]">Mis pedidos</p>
      <h1 className="font-display text-5xl font-extrabold tracking-[-0.06em] text-ink sm:text-6xl">Sigue tu pedido<span className="text-[#8eaf4a]">.</span></h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-ink/60">Introduce el identificador que recibiste al confirmar tu compra para consultar el estado de tu camiseta.</p>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-3 rounded-[22px] border border-ink/10 bg-white p-5 sm:flex-row sm:p-6"><label className="min-w-0 flex-1 text-sm font-semibold">Identificador del pedido<input required value={input} onChange={(event) => setInput(event.target.value)} placeholder="Por ejemplo, TRM-..." className="mt-2 h-12 w-full rounded-xl border border-ink/15 px-4 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-lime" /></label><button type="submit" className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-white hover:bg-[#3a413a]"><Search size={17} /> Buscar pedido</button></form>
      {error && <p role="alert" className="mt-6 rounded-xl bg-[#fce9e5] p-5 text-sm text-[#873c2e]">{error}</p>}
      {searchId && !order && !error && <p role="status" className="mt-6 rounded-xl bg-[#e8ece0] p-5 text-sm text-ink">No encontramos un pedido con el identificador «{searchId}». Revisa el número e inténtalo de nuevo.</p>}
      {order && <div className="mt-8"><OrderDetails order={order} /></div>}
    </div>
  )
}
