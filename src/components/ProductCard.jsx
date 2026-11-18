import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products.js'

export default function ProductCard({ product }) {
  return (
    <article className="group min-w-0">
      <Link to={`/personalizador?producto=${product.id}`} aria-label={`Ver ${product.name} en el personalizador`} className="block rounded-[22px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
        <div className={`relative flex aspect-[4/4.4] items-center justify-center overflow-hidden rounded-[22px] ${product.background}`}>
          {product.badge && <span className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-ink">{product.badge}</span>}
          <img src={product.image} alt={product.imageAlt} loading="lazy" className="h-[88%] w-[88%] object-contain transition-transform duration-500 group-hover:scale-[1.055]" />
          <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-sm transition-colors group-hover:bg-lime" aria-hidden="true"><ArrowUpRight size={19} /></span>
        </div>
      </Link>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-ink/50">{product.category}</p>
          <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">{product.name}</h3>
        </div>
        <span className="whitespace-nowrap pt-4 text-sm font-bold text-ink">{formatPrice(product.price)}</span>
      </div>
      <Link to={`/personalizador?producto=${product.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:text-[#63832c]">Personalizar <ArrowUpRight size={16} /></Link>
    </article>
  )
}
