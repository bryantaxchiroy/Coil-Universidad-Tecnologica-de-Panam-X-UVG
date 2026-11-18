import { Link, useLocation, useParams } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Button from '../components/Button.jsx'
import OrderDetails from '../components/OrderDetails.jsx'
import { findOrder } from '../data/orderStorage.js'

export default function OrderConfirmation() {
  const { id } = useParams()
  const { state } = useLocation()
  let order = null
  let error = ''
  try { order = findOrder(id) } catch (caught) { error = caught.message }
  if (!order) return <section className="mx-auto max-w-7xl px-5 py-24 text-center"><h1 className="font-display text-3xl font-bold">No encontramos este pedido.</h1><p role={error ? 'alert' : undefined} className="mt-3 text-sm text-ink/60">{error || 'Comprueba el identificador y vuelve a intentarlo.'}</p><Button to="/seguimiento" className="mt-6">Buscar pedido</Button></section>
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-12 sm:px-8 lg:pt-18">
      <div className="mb-9 rounded-[28px] bg-lime p-8 sm:p-12"><CheckCircle2 size={43} strokeWidth={1.6} /><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em]">Pago de demostración</p><h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">¡Pedido confirmado!</h1><p className="mt-4 max-w-xl text-sm leading-7 text-ink/75">Tu pedido se guardó correctamente con estado «Pagado». Este pago fue simulado; no se realizó ningún cobro real.</p><Link to={`/seguimiento?pedido=${encodeURIComponent(order.id)}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4">Seguir mi pedido <ArrowRight size={17} /></Link></div>
      {state?.warning && <p role="alert" className="mb-5 rounded-xl bg-[#fce9e5] p-4 text-sm text-[#873c2e]">{state.warning}</p>}
      <OrderDetails order={order} />
      <Button to="/catalogo" variant="outline" className="mt-8">Continuar comprando</Button>
    </div>
  )
}
