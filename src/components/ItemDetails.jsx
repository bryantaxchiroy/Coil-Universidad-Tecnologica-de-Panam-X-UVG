export default function ItemDetails({ item }) {
  return (
    <div className="mt-1 space-y-0.5 text-xs leading-5 text-ink/60 sm:text-sm">
      <p>Talla {item.size} · {item.color}</p>
      {Array.isArray(item.elements) ? item.elements.map((element) => <p key={element.id}>{element.type === 'text' ? `Texto: «${element.content}»` : `Imagen personalizada: ${element.name || 'Imagen cargada'}`}</p>) : <>{item.text?.content && <p>Texto: «{item.text.content}»</p>}{item.image && <p>Imagen personalizada: {item.image.name || 'Imagen cargada'}</p>}</>}
      {!item.elements?.length && !item.text?.content && !item.image && <p>Diseño original</p>}
    </div>
  )
}
