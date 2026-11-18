import OrderItems from './OrderItems.jsx'
import OrderProgress from './OrderProgress.jsx'
import { formatPrice } from '../data/products.js'

export default function OrderDetails({ order }) {
  const date = new Intl.DateTimeFormat('es-PA', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(order.createdAt))
  return (
    <div className="space-y-5">
      <section className="rounded-[22px] bg-[#e8ece0] p-5 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[#63832c]">Pedido</p><h2 className="mt-2 break-all font-display text-2xl font-bold sm:text-3xl">{order.id}</h2><p className="mt-2 text-sm text-ink/60">Creado el {date}</p></div><span className="rounded-full bg-lime px-4 py-2 text-xs font-bold text-ink">{order.status}</span></div><div className="mt-7 border-t border-ink/15 pt-7"><OrderProgress order={order} /></div></section>
      <section className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-8"><h2 className="mb-6 font-display text-xl font-bold">Productos solicitados</h2><OrderItems items={order.items} /><div className="mt-6 flex justify-between border-t border-ink/15 pt-5 font-display text-xl font-bold"><span>Total</span><span>{formatPrice(order.total)}</span></div></section>
      <section className="rounded-[22px] border border-ink/10 bg-white p-5 text-sm sm:p-8"><h2 className="font-display text-xl font-bold">Entrega</h2><p className="mt-2 text-ink/60">{order.delivery.method === 'retiro' ? 'Retiro en tienda' : `Envío a ${order.delivery.address}`}</p></section>
    </div>
  )
}
