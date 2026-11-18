import { useState } from 'react'
import { ArrowUpRight, Search, SlidersHorizontal, X } from 'lucide-react'
import ProductCard from '../components/ProductCard.jsx'
import { categories, colors, filterProducts, products, sizes } from '../data/products.js'

const initialFilters = { search: '', category: '', size: '', color: '' }

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-xs font-bold text-ink/70">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm font-medium text-ink outline-none focus:border-ink focus:ring-2 focus:ring-lime">
        <option value="">Todos</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

export default function Catalog() {
  const [filters, setFilters] = useState(initialFilters)
  const visibleProducts = filterProducts(products, filters)
  const hasFilters = Object.values(filters).some(Boolean)
  const updateFilter = (key, value) => setFilters((previous) => ({ ...previous, [key]: value }))

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 lg:px-10 lg:pt-20">
      <div className="mb-11 flex flex-col justify-between gap-7 border-b border-ink/10 pb-10 md:flex-row md:items-end">
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#63832c]">Hechas para expresarte</p>
          <h1 className="font-display text-[clamp(2.8rem,10vw,4.5rem)] font-extrabold tracking-[-0.065em] text-ink">El catálogo<span className="text-[#8eaf4a]">.</span></h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-ink/60">Diseños que van contigo. Explora la colección y encuentra esa camiseta que dice exactamente lo que eres.</p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60">{products.length} diseños para descubrir <ArrowUpRight size={17} /></span>
      </div>
      <div className="mb-9 rounded-[22px] border border-ink/10 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-bold text-ink"><SlidersHorizontal size={18} /> Encuentra tu estilo</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_0.7fr_1fr]">
          <label className="flex min-w-0 flex-col gap-2 text-xs font-bold text-ink/70">
            Buscar por nombre
            <span className="relative block"><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/45" /><input type="search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="¿Qué camiseta buscas?" className="h-12 w-full rounded-xl border border-ink/15 bg-white pl-10 pr-3 text-sm font-medium text-ink outline-none placeholder:text-ink/40 focus:border-ink focus:ring-2 focus:ring-lime" /></span>
          </label>
          <FilterSelect label="Categoría" value={filters.category} options={categories} onChange={(value) => updateFilter('category', value)} />
          <FilterSelect label="Talla" value={filters.size} options={sizes} onChange={(value) => updateFilter('size', value)} />
          <FilterSelect label="Color" value={filters.color} options={colors} onChange={(value) => updateFilter('color', value)} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/60">
          <span role="status">{visibleProducts.length} {visibleProducts.length === 1 ? 'camiseta encontrada' : 'camisetas encontradas'}</span>
          {hasFilters && <button type="button" onClick={() => setFilters(initialFilters)} className="inline-flex items-center gap-1 font-bold text-ink hover:text-[#63832c]"><X size={15} /> Limpiar filtros</button>}
        </div>
      </div>
      {visibleProducts.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-7">
          {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="rounded-[22px] bg-[#e8ece0] px-6 py-16 text-center">
          <Search size={32} className="mx-auto mb-4 text-ink/50" />
          <h2 className="font-display text-2xl font-bold text-ink">No encontramos camisetas con esos filtros.</h2>
          <p className="mt-2 text-sm text-ink/60">Prueba con otro nombre, categoría, talla o color.</p>
          <button type="button" onClick={() => setFilters(initialFilters)} className="mt-5 text-sm font-bold text-ink underline underline-offset-4">Ver todas las camisetas</button>
        </div>
      )}
    </div>
  )
}
