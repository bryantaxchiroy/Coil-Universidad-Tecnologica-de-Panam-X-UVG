import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, ShoppingBag, X } from 'lucide-react'

const links = [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Mis pedidos', to: '/seguimiento' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close the mobile menu after navigation, including browser back/forward.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const navClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors hover:text-ink ${isActive ? 'text-ink' : 'text-ink/55'}`

  return (
    <header className="relative z-20 border-b border-ink/8 bg-paper">
      <button type="button" onClick={() => { const main = document.getElementById('contenido'); main?.focus(); main?.scrollIntoView() }} className="sr-only rounded bg-ink px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-3">Ir al contenido</button>
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
        <Link to="/" aria-label="Trama, ir a inicio" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-ink text-lime"><span className="brand-mark">t.</span></span>
          <span className="font-display text-[25px] font-extrabold tracking-[-0.07em] text-ink">trama<span className="text-[#7fa13b]">.</span></span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-9 md:flex">
          {links.map((link) => <NavLink key={link.to} end={link.to === '/'} to={link.to} className={navClass}>{link.label}</NavLink>)}
        </nav>

        <div className="flex items-center gap-3">
          <NavLink to="/carrito" aria-label="Carrito" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:bg-lime">
            <ShoppingBag size={19} strokeWidth={1.8} />
          </NavLink>
          <Link to="/catalogo" className="hidden items-center gap-1.5 text-sm font-bold text-ink transition-colors hover:text-[#66872c] lg:flex">Explorar tienda <ArrowUpRight size={16} /></Link>
          <button type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} aria-controls="menu-movil" onClick={() => setMenuOpen(!menuOpen)} className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/12 text-ink md:hidden">
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav id="menu-movil" aria-label="Navegación móvil" className="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-ink/10 bg-paper px-5 pb-5 pt-2 shadow-lg sm:px-8 md:hidden">
          {links.map((link) => <NavLink key={link.to} end={link.to === '/'} to={link.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `rounded-xl px-4 py-3 text-base font-semibold ${isActive ? 'bg-lime text-ink' : 'text-ink/70 hover:bg-ink/5'}`}>{link.label}</NavLink>)}
          <NavLink to="/carrito" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-base font-semibold text-ink/70 hover:bg-ink/5">Carrito</NavLink>
        </nav>
      )}
    </header>
  )
}
