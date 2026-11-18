import { DESIGN_HEIGHT, DESIGN_WIDTH, PRINT_ZONE, isOutsidePrint, shirtColors } from '../data/customization.js'

function Graphic({ productId }) {
  switch (productId) {
    case 'pulso-urbano':
      return <g fill="#d8f28a"><path d="M265 269h42l-26 55h50l-91 111 30-83h-46z" /><text x="300" y="458" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="21" fontWeight="bold" letterSpacing="4">EN MOVIMIENTO</text></g>
    case 'linea-libre':
      return <g fill="none" stroke="#24465b" strokeWidth="6" strokeLinecap="round"><path d="M228 369q-8-64 40-88 42-19 62 17 18 33-21 48-41 16-26-41 11-45 52-32 39 13 34 62-3 42-43 67-43 28-94 2" /><text x="300" y="459" textAnchor="middle" fill="#24465b" stroke="none" fontFamily="Arial,sans-serif" fontSize="21" fontWeight="bold" letterSpacing="4">LÍNEA LIBRE</text></g>
    case 'fuera-de-serie':
      return <g transform="rotate(-6 300 353)"><rect x="211" y="270" width="178" height="166" rx="9" fill="#e8b49c" /><text x="300" y="330" textAnchor="middle" fill="#20394b" fontFamily="Arial,sans-serif" fontSize="38" fontWeight="900">FUERA</text><text x="300" y="370" textAnchor="middle" fill="#20394b" fontFamily="Arial,sans-serif" fontSize="28" fontWeight="900">DE SERIE</text></g>
    case 'modo-creativo':
      return <g><circle cx="300" cy="350" r="84" fill="#f2dfb6" /><path d="M234 370q54-88 132-57-53 8-52 61 0 40-57 48 28-22 17-45-12-20-40-7z" fill="#263e36" /><text x="300" y="468" textAnchor="middle" fill="#f9e9c8" fontFamily="Arial,sans-serif" fontSize="20" fontWeight="bold" letterSpacing="3">MODO CREATIVO</text></g>
    default:
      return null
  }
}

export default function ShirtPreview({ product, customization, selectedId, onSelect, onPointerDown, stageRef, showPrintGuide = false }) {
  const { color } = customization
  const elements = customization.elements || []
  const showCustom = elements.length > 0
  const colorHex = shirtColors[color] || shirtColors[product.colors[0]]
  const lightShirt = ['Blanco', 'Crema', 'Gris'].includes(color || product.colors[0])

  return (
    <div ref={stageRef} onPointerDown={onPointerDown} className="relative mx-auto w-full max-w-[600px] aspect-[600/650] select-none" style={{ containerType: 'inline-size', touchAction: onPointerDown ? 'none' : 'auto' }} role="img" aria-label={`Vista previa de ${product.name} en color ${color || product.colors[0]} con ${elements.length} elementos personalizados`}>
      <svg viewBox="0 0 600 650" className="h-full w-full" aria-hidden="true">
        <defs>
          <filter id="preview-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="8" dy="16" stdDeviation="13" floodColor="#202820" floodOpacity=".2" /></filter>
          <linearGradient id="preview-cloth" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".16" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".15" /></linearGradient>
        </defs>
        <path filter="url(#preview-shadow)" d="M166 112 229 78Q252 100 300 100t71-22l63 34 96 92-60 68-43-37v308q-127 27-254 0V235l-43 37-60-68z" fill={colorHex} stroke={lightShirt ? '#c4c5bb' : '#1c2825'} strokeWidth="3" />
        <path d="M166 112 229 78Q252 100 300 100t71-22l63 34 96 92-60 68-43-37v308q-127 27-254 0V235l-43 37-60-68z" fill="url(#preview-cloth)" />
        <path d="M229 78q71 91 142 0l-25-13q-46 49-92 0z" fill={lightShirt ? '#d5d2c7' : '#19221f'} opacity=".75" />
        <path d="M251 68q49 47 98 0M172 235q18-21 22-69M428 235q-18-21-22-69M178 535q122 23 244 0" fill="none" stroke={lightShirt ? '#bbb9b0' : '#85918a'} strokeOpacity=".35" strokeWidth="3" />
        {!showCustom && <Graphic productId={product.id} />}
        {showPrintGuide && <polygon points={PRINT_ZONE.map(({ x, y }) => `${x},${y}`).join(' ')} fill="none" stroke={lightShirt ? '#435b35' : '#d8f28a'} strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" pointerEvents="none" aria-hidden="true" />}
      </svg>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {elements.map((element) => {
          const selected = selectedId === element.id
          const outside = isOutsidePrint(element)
          return <div key={element.id} data-element-id={element.id} onClick={() => onSelect?.(element.id)} className={`absolute flex items-center justify-center pointer-events-auto ${onPointerDown ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'} ${selected ? `outline outline-2 ${outside ? 'outline-red-500' : 'outline-[#64842d]'}` : ''}`}
            style={{ left: `${element.x / DESIGN_WIDTH * 100}%`, top: `${element.y / DESIGN_HEIGHT * 100}%`, width: `${element.width / DESIGN_WIDTH * 100}%`, height: `${element.height / DESIGN_HEIGHT * 100}%`, transform: `translate(-50%, -50%) rotate(${element.rotation}deg)` }}>
            {element.type === 'image' ? <img src={element.content} alt="" draggable="false" className="pointer-events-none h-full w-full object-contain" /> : <span className="pointer-events-none flex h-full w-full items-center justify-center text-center font-bold leading-tight [overflow-wrap:anywhere]" style={{ color: element.color, fontFamily: element.font, fontSize: `${Math.max(1, element.height * 0.45) / DESIGN_WIDTH * 100}cqw`, textShadow: '0 1px 2px #0003' }}>{element.content}</span>}
            {selected && onPointerDown && <><button type="button" data-action="rotate" aria-label="Girar elemento" className="absolute -top-8 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full border-2 border-white bg-[#64842d] text-white shadow" style={{ touchAction: 'none' }}>↻</button><button type="button" data-action="resize" aria-label="Redimensionar elemento" className="absolute -bottom-3 -right-3 h-7 w-7 rounded-full border-2 border-white bg-[#64842d] text-white shadow" style={{ touchAction: 'none' }}>↘</button></>}
          </div>
        })}
      </div>
    </div>
  )
}
