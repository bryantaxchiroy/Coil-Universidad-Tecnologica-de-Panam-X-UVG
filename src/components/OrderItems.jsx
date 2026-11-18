import ItemDetails from './ItemDetails.jsx'
import ItemThumbnail from './ItemThumbnail.jsx'
import { formatPrice } from '../data/products.js'

export default function OrderItems({ items }) {
  return (
    <ul className="divide-y divide-ink/10">
      {items.map((item) => <li key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0"><ItemThumbnail item={item} /><div className="min-w-0 flex-1"><p className="font-display font-bold text-ink">{item.name}</p><ItemDetails item={item} /><p className="mt-2 text-xs text-ink/60">Cantidad: {item.quantity}</p></div><strong className="shrink-0 text-sm text-ink">{formatPrice(item.price * item.quantity)}</strong></li>)}
    </ul>
  )
}
