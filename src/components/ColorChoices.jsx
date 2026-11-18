import { Check } from 'lucide-react'
import { colorChoice } from '../data/customization.js'

function isLight(hex) {
  const full = hex.length === 4 ? hex.slice(1).split('').map((digit) => digit + digit).join('') : hex.slice(1)
  const [red, green, blue] = [0, 2, 4].map((index) => parseInt(full.slice(index, index + 2), 16))
  return (red * 299 + green * 587 + blue * 114) / 1000 >= 155
}

export default function ColorChoices({ options, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const { name, value, swatch } = colorChoice(option)
        return (
          <button key={value} type="button" onClick={() => onSelect(value)} title={name} aria-label={`Color ${name}`} aria-pressed={selected === value} className={`flex h-11 w-11 items-center justify-center rounded-full border-2 p-1 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${selected === value ? 'border-ink' : 'border-ink/15'}`}>
            <span className="flex h-full w-full items-center justify-center rounded-full border border-ink/10" style={{ backgroundColor: swatch }}>
              {selected === value && <Check size={17} strokeWidth={3} className={isLight(swatch) ? 'text-ink' : 'text-white'} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
