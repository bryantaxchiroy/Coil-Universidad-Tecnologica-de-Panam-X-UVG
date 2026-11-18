import { Check } from 'lucide-react'
import { orderStages } from '../data/orderStorage.js'

export default function OrderProgress({ order }) {
  const stages = orderStages(order.delivery.method)
  const current = stages.indexOf(order.status)
  return (
    <div><h2 className="font-display text-xl font-bold text-ink">Estado del pedido</h2><p className="mt-1 text-sm text-ink/60">{order.status}</p><ol className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-2">{stages.map((stage, index) => <li key={stage} className="flex items-center gap-3 sm:flex-col sm:items-start"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index <= current ? 'bg-ink text-lime' : 'border border-ink/20 bg-white text-ink/45'}`}>{index < current ? <Check size={18} /> : index + 1}</span><span className={`text-sm leading-tight ${index <= current ? 'font-bold text-ink' : 'text-ink/50'}`}>{stage}</span></li>)}</ol></div>
  )
}
