import { useEffect, useState } from 'react'
import { cartUnitCount, subscribeCart } from '../data/cartStorage.js'

function readCount() {
  if (typeof window === 'undefined') return { count: 0, error: '' }
  try { return { count: cartUnitCount(), error: '' } }
  catch (error) { return { count: 0, error: error.message } }
}

export default function useCartCount() {
  const [summary, setSummary] = useState(readCount)

  useEffect(() => {
    const refresh = () => setSummary(readCount())
    const unsubscribe = subscribeCart(refresh)
    refresh()
    return unsubscribe
  }, [])

  return summary
}
