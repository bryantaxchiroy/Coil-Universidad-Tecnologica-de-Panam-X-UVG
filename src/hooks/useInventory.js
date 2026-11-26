import { useEffect, useState } from 'react'
import { getInventory, subscribeInventory } from '../data/inventoryStorage.js'
import { subscribeOrders } from '../data/orderStorage.js'

export default function useInventory() {
  const [, setRevision] = useState(0)
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    const unsubscribeInventory = subscribeInventory(refresh)
    const unsubscribeOrders = subscribeOrders(refresh)
    return () => { unsubscribeInventory(); unsubscribeOrders() }
  }, [])
  try { return { inventory: getInventory(), error: '' } }
  catch (error) { return { inventory: null, error: error.message } }
}
