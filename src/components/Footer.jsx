import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-5 pb-7 pt-14 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-10 border-b border-white/15 pb-12 md:flex-row">
          <div className="max-w-sm">
            <Link to="/" className="font-display text-4xl font-extrabold tracking-[-0.07em]">trama<span className="text-lime">.</span></Link>
            <p className="mt-4 text-sm leading-7 text-white/60">Camisetas con personalidad para quienes no tienen miedo de expresarse. Tu estilo empieza aquí.</p>
          </div>
          <div className="flex flex-wrap gap-x-20 gap-y-8 text-sm">
            <div className="flex flex-col gap-4">
              <span className="font-bold text-white">Explora</span>
              <Link to="/catalogo" className="text-white/60 hover:text-lime">Catálogo</Link>
              <Link to="/personalizador" className="text-white/60 hover:text-lime">Personalizador</Link>
              <Link to="/carrito" className="text-white/60 hover:text-lime">Carrito</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-bold text-white">Tu cuenta</span>
              <Link to="/seguimiento" className="text-white/60 hover:text-lime">Mis pedidos</Link>
              <Link to="/checkout" className="text-white/60 hover:text-lime">Checkout</Link>
              <Link to="/administracion" className="inline-flex items-center gap-1 text-white/60 hover:text-lime">Administración <ArrowUpRight size={14} /></Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-2 pt-6 text-xs text-white/45 sm:flex-row">
          <span>© {new Date().getFullYear()} Trama. Camisetas con tu sello.</span>
          <span>Proyecto universitario · Prototipo de demostración</span>
        </div>
      </div>
    </footer>
  )
}
