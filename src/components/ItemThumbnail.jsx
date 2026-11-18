import ShirtPreview from './ShirtPreview.jsx'
import { products } from '../data/products.js'
import { cartDesignElements } from '../data/customization.js'

export default function ItemThumbnail({ item }) {
  const product = products.find(({ id }) => id === item.productId)
  return (
    <div className={`w-24 shrink-0 overflow-hidden rounded-2xl sm:w-32 ${product?.background || 'bg-[#e8ece0]'}`}>
      {product ? <ShirtPreview product={product} customization={{ color: item.color, elements: cartDesignElements(item) }} /> : <div className="flex aspect-[600/650] items-center justify-center px-2 text-center text-xs text-ink/60">{item.name}</div>}
    </div>
  )
}
