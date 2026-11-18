import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LockKeyhole, ShoppingBag } from 'lucide-react'
import Button from '../components/Button.jsx'
import OrderItems from '../components/OrderItems.jsx'
import { cartTotals, getCart } from '../data/cartStorage.js'
import { createOrder, validateCheckout } from '../data/orderStorage.js'
import { formatPrice } from '../data/products.js'

const inputClass = 'mt-2 h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-lime'

function loadCart() {
  try { return { items: getCart(), error: '' } } catch (error) { return { items: [], error: error.message } }
}

export default function Checkout() {
  const navigate = useNavigate()
  const [cart] = useState(loadCart)
  const [customer, setCustomer] = useState({ fullName: '', email: '', phone: '' })
  const [delivery, setDelivery] = useState({ method: 'envio', address: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { subtotal, total, count } = cartTotals(cart.items)

  const submit = (event) => {
    event.preventDefault()
    if (submitting) return
    const fieldErrors = validateCheckout({ customer, delivery })
    setErrors(fieldErrors)
    setSubmitError('')
    if (Object.keys(fieldErrors).length) return
    setSubmitting(true)
    try {
      const { order, warning } = createOrder({ customer, delivery })
      navigate(`/pedido/${encodeURIComponent(order.id)}`, { replace: true, state: { warning } })
    } catch (error) {
      setSubmitError(error.message)
      setSubmitting(false)
    }
  }

  if (cart.error || !cart.items.length) return <section className="mx-auto max-w-7xl px-5 py-24 text-center sm:px-8"><ShoppingBag size={42} className="mx-auto text-ink/50" /><h1 className="mt-5 font-display text-3xl font-bold text-ink">{cart.error ? 'No pudimos abrir tu carrito.' : 'Tu carrito está vacío.'}</h1><p className="mx-auto mt-3 max-w-lg text-sm text-ink/60">{cart.error || 'Agrega una camiseta antes de finalizar la compra.'}</p><Button to="/carrito" className="mt-6">Volver al carrito</Button></section>

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-12 sm:px-8 lg:px-10 lg:pt-18">
      <Link to="/carrito" className="inline-flex items-center gap-2 text-sm font-bold text-ink/60 hover:text-ink"><ArrowLeft size={17} /> Volver al carrito</Link>
      <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#63832c]">Último paso</p>
      <h1 className="font-display text-5xl font-extrabold tracking-[-0.06em] text-ink sm:text-6xl">Finaliza tu pedido<span className="text-[#8eaf4a]">.</span></h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-ink/60">Este pedido y su pago son una simulación. No se cobrarán importes ni se solicitarán datos bancarios.</p>
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <form onSubmit={submit} noValidate className="space-y-6 rounded-[22px] border border-ink/10 bg-white p-5 sm:p-8">
          <div><h2 className="font-display text-2xl font-bold">Tus datos</h2><p className="mt-1 text-xs text-ink/55">Los campos marcados son obligatorios.</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold sm:col-span-2">Nombre completo *<input autoComplete="name" required value={customer.fullName} onChange={(event) => setCustomer({ ...customer, fullName: event.target.value })} className={inputClass} aria-invalid={Boolean(errors.fullName)} />{errors.fullName && <span className="mt-1 block text-xs text-[#873c2e]">{errors.fullName}</span>}</label>
            <label className="block text-sm font-semibold">Correo electrónico *<input type="email" autoComplete="email" required value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} className={inputClass} aria-invalid={Boolean(errors.email)} />{errors.email && <span className="mt-1 block text-xs text-[#873c2e]">{errors.email}</span>}</label>
            <label className="block text-sm font-semibold">Teléfono *<input type="tel" autoComplete="tel" required value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} className={inputClass} aria-invalid={Boolean(errors.phone)} />{errors.phone && <span className="mt-1 block text-xs text-[#873c2e]">{errors.phone}</span>}</label>
          </div>
          <fieldset className="border-t border-ink/10 pt-6"><legend className="sr-only">Método de entrega</legend><h2 className="mb-4 font-display text-2xl font-bold">Método de entrega</h2><div className="grid gap-3 sm:grid-cols-2">{[{ value: 'envio', label: 'Envío a domicilio' }, { value: 'retiro', label: 'Retiro en tienda' }].map(({ value, label }) => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-semibold ${delivery.method === value ? 'border-ink bg-[#e8ece0]' : 'border-ink/15'}`}><input type="radio" name="entrega" value={value} checked={delivery.method === value} onChange={() => setDelivery({ ...delivery, method: value })} className="accent-[#64842d]" /> {label}</label>)}</div>{delivery.method === 'envio' && <label className="mt-5 block text-sm font-semibold">Dirección de entrega *<input autoComplete="street-address" required value={delivery.address} onChange={(event) => setDelivery({ ...delivery, address: event.target.value })} placeholder="Calle, número, ciudad y referencias" className={inputClass} aria-invalid={Boolean(errors.address)} />{errors.address && <span className="mt-1 block text-xs text-[#873c2e]">{errors.address}</span>}</label>}{delivery.method === 'retiro' && <p className="mt-4 text-sm text-ink/60">Te avisaremos cuando tu pedido esté listo para retirar.</p>}</fieldset>
          <div className="rounded-xl bg-[#e8ece0] p-4 text-sm leading-6 text-ink"><LockKeyhole size={18} className="mr-2 inline" /> Pago de demostración: al confirmar, el pedido se marcará como «Pagado». No se procesará ningún pago real.</div>
          {submitError && <p role="alert" className="rounded-xl bg-[#fce9e5] p-4 text-sm font-semibold text-[#873c2e]">{submitError}</p>}
          <Button type="submit" disabled={submitting} className="w-full disabled:opacity-50">{submitting ? 'Confirmando…' : 'Confirmar pedido (simulación)'}</Button>
        </form>
        <aside className="rounded-[22px] bg-[#e8ece0] p-5 sm:p-7 lg:sticky lg:top-6"><h2 className="font-display text-2xl font-bold">Tu pedido</h2><p className="mb-6 mt-1 text-xs text-ink/55">{count} {count === 1 ? 'camiseta' : 'camisetas'}</p><OrderItems items={cart.items} /><div className="mt-6 space-y-3 border-t border-ink/20 pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>Entrega</span><span>Sin cargo</span></div></div><div className="mt-5 flex justify-between border-t border-ink/20 pt-5 font-display text-xl font-bold"><span>Total</span><span>{formatPrice(total)}</span></div></aside>
      </div>
    </div>
  )
}
