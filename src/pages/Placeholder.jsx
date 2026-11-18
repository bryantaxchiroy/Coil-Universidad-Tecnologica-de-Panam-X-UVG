import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react'
import Button from '../components/Button.jsx'

export default function Placeholder({ eyebrow, title, description, next }) {
  return (
    <section className="mx-auto flex max-w-7xl flex-col px-5 py-12 sm:px-8 lg:px-10 lg:py-20">
      <div className="relative flex min-h-[490px] flex-col items-start justify-center overflow-hidden rounded-[28px] bg-[#e8ece0] px-8 py-16 sm:px-14 lg:min-h-[550px] lg:px-20">
        <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full border-[55px] border-lime/70 sm:h-[450px] sm:w-[450px] sm:border-[85px]" aria-hidden="true" />
        <div className="absolute right-[12%] top-[15%] hidden h-20 w-20 rotate-12 items-center justify-center rounded-2xl bg-lime text-4xl text-ink sm:flex" aria-hidden="true">✳</div>
        <div className="relative z-10 max-w-[670px]">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink"><Sparkles size={15} /> {eyebrow}</span>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.065em] text-ink sm:text-6xl lg:text-7xl">{title}</h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-ink/65 sm:text-lg">{description}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button to="/catalogo">Explorar catálogo <ArrowUpRight size={17} /></Button>
            <Button to="/" variant="outline"><ArrowLeft size={17} /> Volver al inicio</Button>
          </div>
        </div>
      </div>
      <p className="mt-5 text-center text-sm text-ink/50">{next}</p>
    </section>
  )
}
