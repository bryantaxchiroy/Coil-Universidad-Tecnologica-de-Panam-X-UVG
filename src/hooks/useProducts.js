import { useEffect, useState } from 'react'
import { getProducts, subscribeProducts } from '../data/productStorage.js'

export default function useProducts() {
  const [, setRevision] = useState(0)
  useEffect(() => subscribeProducts(() => setRevision((value) => value + 1)), [])
  try { return { products: getProducts(), error: '' } }
  catch (error) { return { products: [], error: error.message } }
}
