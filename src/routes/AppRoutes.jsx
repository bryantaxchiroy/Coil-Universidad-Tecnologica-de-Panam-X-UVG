import { Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Home from '../pages/Home.jsx'
import Catalog from '../pages/Catalog.jsx'
import Customizer from '../pages/Customizer.jsx'
import Cart from '../pages/Cart.jsx'
import Checkout from '../pages/Checkout.jsx'
import OrderConfirmation from '../pages/OrderConfirmation.jsx'
import Tracking from '../pages/Tracking.jsx'
import Administration from '../pages/Administration.jsx'
import NotFound from '../pages/NotFound.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="personalizador" element={<Customizer />} />
        <Route path="carrito" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="pedido/:id" element={<OrderConfirmation />} />
        <Route path="seguimiento" element={<Tracking />} />
        <Route path="administracion" element={<Administration />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
