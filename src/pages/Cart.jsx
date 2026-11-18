import { useState } from 'react'
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Button from '../components/Button.jsx'
import ItemDetails from '../components/ItemDetails.jsx'
import ItemThumbnail from '../components/ItemThumbnail.jsx'
import { cartTotals, changeCartQuantity, clearCart, getCart, MAX_CART_QUANTITY, removeCartItem } from '../data/cartStorage.js'
import { formatPrice } from '../data/products.js'

function loadCart() {
  try { return { items: getCart(), error: '' } } catch (error) { return { items: [], error: error.message } }
}

export default function Cart() {
  const [cart, setCart] = useState(loadCart)
  const [error, setError] = useState('')
  const { subtotal, total, count } = cartTotals(cart.items)

  const update = (action) => {
    try {
      setCart({ items: action(), error: '' })
      setError('')
    } catch (caught) {
      setError(caught.message)
    }
  }

  const discardCorrupt = () => {
    try { clearCart(); setCart({ items: [], error: '' }); setError('') }
    catch (caught) { setError(caught.message) }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-12 sm:px-8 lg:px-10 lg:pt-18">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#63832c]">Tu selección</p>
      <h1 className="font-display text-5xl font-extrabold tracking-[-0.06em] text-ink sm:text-6xl">Tu carrito<span className="text-[#8eaf4a]">.</span></h1>
      <p className="mt-3 text-sm text-ink/60">{count} {count === 1 ? 'camiseta lista' : 'camisetas listas'} para llevar tu estilo más lejos.</p>
      {(cart.error || error) && <div role="alert" className="mt-7 rounded-2xl bg-[#fce9e5] p-5 text-sm text-[#873c2e]"><p>{cart.error || error}</p>{cart.error && <button type="button" onClick={discardCorrupt} className="mt-3 font-bold underline underline-offset-4">Descartar carrito dañado</button>}</div>}
      {!cart.error && (cart.items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-[28px] bg-[#e8ece0] px-6 py-20 text-center"><ShoppingBag size={38} strokeWidth={1.5} /><h2 className="mt-5 font-display text-3xl font-bold">Aún no hay nada por aquí.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-ink/60">Explora el catálogo y crea una camiseta con tu sello para verla en este espacio.</p><Button to="/catalogo" className="mt-7">Explorar camisetas <ArrowRight size={17} /></Button></div>
      ) : (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <article key={item.id} className="flex gap-4 rounded-[22px] border border-ink/10 bg-white p-4 sm:gap-6 sm:p-6">
                <ItemThumbnail item={item} />
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-display text-lg font-bold text-ink sm:text-xl">{item.name}</h2><ItemDetails item={item} /></div><strong className="text-sm text-ink sm:text-base">{formatPrice(item.price * item.quantity)}</strong></div>
                  <div className="flex flex-wrap items-center justify-between gap-3"><div className="inline-flex items-center rounded-full border border-ink/15"><button type="button" onClick={() => update(() => changeCartQuantity(item.id, item.quantity - 1))} disabled={item.quantity <= 1} aria-label={`Disminuir cantidad de ${item.name}`} className="flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-30"><Minus size={16} /></button><span className="min-w-7 text-center text-sm font-bold" aria-label={`Cantidad: ${item.quantity}`}>{item.quantity}</span><button type="button" onClick={() => update(() => changeCartQuantity(item.id, item.quantity + 1))} disabled={item.quantity >= MAX_CART_QUANTITY} aria-label={`Aumentar cantidad de ${item.name}`} className="flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-30"><Plus size={16} /></button></div><button type="button" onClick={() => update(() => removeCartItem(item.id))} className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/55 hover:text-[#873c2e]"><Trash2 size={16} /> Eliminar</button></div>
                </div>
              </article>
            ))}
            <Button to="/catalogo" variant="outline"><ArrowLeft size={17} /> Continuar comprando</Button>
          </div>
          <aside className="rounded-[22px] bg-[#e8ece0] p-6 lg:sticky lg:top-6"><h2 className="font-display text-2xl font-bold">Resumen de compra</h2><div className="mt-6 flex justify-between text-sm"><span>Subtotal ({count})</span><span className="font-bold">{formatPrice(subtotal)}</span></div><p className="mt-3 text-xs text-ink/55">Entrega sin cargo en esta demostración.</p><div className="mt-6 flex justify-between border-t border-ink/20 pt-5 font-display text-xl font-bold"><span>Total</span><span>{formatPrice(total)}</span></div><Button to="/checkout" className="mt-6 w-full">Finalizar compra <ArrowRight size={17} /></Button></aside>
        </div>
      ))}
    </div>
  )
}
