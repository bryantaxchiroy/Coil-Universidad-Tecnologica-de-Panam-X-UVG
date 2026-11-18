import { ArrowDownRight, ArrowRight, ArrowUpRight, MoveUpRight, ShoppingBag, Sparkles, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { products } from '../data/products.js'
import useCartCount from '../hooks/useCartCount.js'

export default function Home() {
  const { count, error } = useCartCount()
  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-5 sm:px-8 lg:px-10 lg:pt-7">
        <div className="relative grid min-h-[560px] overflow-hidden rounded-[28px] bg-lime md:grid-cols-[1.05fr_0.95fr] lg:min-h-[620px]">
          <div className="relative z-10 flex flex-col items-start justify-center px-7 py-14 sm:px-12 md:py-16 lg:px-16">
            <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-ink/25 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink sm:text-xs"><Sparkles size={15} /> Viste lo que te hace único</span>
            <h1 className="max-w-[650px] font-display text-[clamp(3.5rem,6.2vw,6.8rem)] font-extrabold leading-[0.99] tracking-[-0.075em] text-ink">Tu estilo.<br />Tus reglas<span className="text-white">.</span></h1>
            <p className="mt-7 max-w-[420px] text-base leading-7 text-ink/75 sm:text-lg">Camisetas con carácter para expresar todo eso que te hace diferente. Encuentra la tuya y hazla tuya.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button to="/catalogo">Explorar camisetas <ArrowUpRight size={18} /></Button>
              <Button to="/carrito" variant="light"><ShoppingBag size={18} /> Ver mi carrito <span aria-label={`${count} unidades en el carrito`} className="inline-flex min-w-6 items-center justify-center rounded-full bg-ink px-1.5 py-0.5 text-xs text-white">{count}</span></Button>
            </div>
            {error && <p role="alert" className="mt-3 max-w-sm text-xs font-semibold text-ink">No se pudo leer el carrito. Revisa tus datos desde «Ver mi carrito».</p>}
            <div className="mt-12 flex items-center gap-3 text-xs font-semibold text-ink/65 sm:mt-16"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/25"><ArrowDownRight size={17} /></span> Diseñadas para destacar, hechas para ti</div>
          </div>
          <div className="hero-visual relative flex min-h-[350px] items-center justify-center overflow-hidden md:min-h-0" aria-hidden="true">
            <div className="absolute h-[440px] w-[440px] rounded-full border border-ink/15 sm:h-[520px] sm:w-[520px]" />
            <div className="absolute h-[310px] w-[310px] rounded-full border border-ink/15 sm:h-[390px] sm:w-[390px]" />
            <div className="absolute h-[210px] w-[210px] rounded-full bg-white/25 sm:h-[290px] sm:w-[290px]" />
            <img src="/images/pulso-urbano.svg" alt="" className="hero-shirt relative z-10 h-[370px] w-[370px] max-w-none object-contain drop-shadow-[0_24px_20px_rgba(35,43,35,0.20)] sm:h-[490px] sm:w-[490px] md:h-[min(48vw,570px)] md:w-[min(48vw,570px)]" />
            <div className="absolute right-[7%] top-[12%] z-10 flex h-[94px] w-[94px] -rotate-12 flex-col items-center justify-center rounded-full bg-ink text-center text-[11px] font-bold uppercase leading-tight tracking-wider text-white sm:right-[10%] sm:top-[15%] sm:h-[120px] sm:w-[120px] sm:text-xs">Hecho para<br /><span className="text-lime">ser tú ✳</span></div>
            <span className="absolute bottom-[12%] left-[7%] z-10 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-ink shadow-sm sm:left-[12%] sm:text-sm">✦ Tu próximo favorito</span>
          </div>
        </div>
      </section>

      <section aria-label="Nuestra propuesta" className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
        <div className="grid gap-5 border-b border-ink/10 pb-9 text-sm font-semibold text-ink/65 sm:grid-cols-3 sm:gap-8 lg:pb-12">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e9eddb] text-ink"><Sparkles size={17} /></span> Diseños con personalidad</div>
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e9eddb] text-ink"><WandSparkles size={17} /></span> Tu toque, tu estilo</div>
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e9eddb] text-ink"><MoveUpRight size={17} /></span> Listas para acompañarte</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-7 sm:px-8 lg:px-10 lg:pb-28 lg:pt-10">
        <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#63832c]">Descubre la colección</p>
            <h2 className="font-display text-4xl font-extrabold tracking-[-0.055em] text-ink sm:text-5xl">Las favoritas del momento<span className="text-[#8eaf4a]">.</span></h2>
            <p className="mt-3 text-sm text-ink/60 sm:text-base">Piezas que hablan por ti, incluso antes de decir una palabra.</p>
          </div>
          <Link to="/catalogo" className="inline-flex shrink-0 items-center gap-2 self-start border-b border-ink pb-1 text-sm font-bold text-ink hover:text-[#63832c] sm:self-auto">Ver todo el catálogo <ArrowRight size={17} /></Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4 lg:gap-7">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <div className="relative flex flex-col items-start justify-between gap-8 overflow-hidden rounded-[28px] bg-[#e8ece0] px-8 py-12 sm:px-12 lg:flex-row lg:items-center lg:px-16 lg:py-16">
          <div className="relative z-10 max-w-xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#63832c]">Personalizador · Tu idea, tu estilo</p>
            <h2 className="font-display text-4xl font-extrabold leading-[1.06] tracking-[-0.06em] text-ink sm:text-5xl">La próxima idea genial<br />puede ser tuya.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-ink/65 sm:text-base">Elige tu camiseta y dale tu propia firma con texto e imágenes en nuestro personalizador.</p>
            <Button to="/personalizador" variant="outline" className="mt-7">Conoce el personalizador <ArrowUpRight size={17} /></Button>
          </div>
          <span className="relative z-10 flex h-28 w-28 shrink-0 rotate-12 items-center justify-center rounded-[28px] bg-lime text-6xl text-ink shadow-[12px_12px_0_#d3d9cb] sm:h-36 sm:w-36 sm:text-7xl" aria-hidden="true">✳</span>
        </div>
      </section>
    </>
  )
}
