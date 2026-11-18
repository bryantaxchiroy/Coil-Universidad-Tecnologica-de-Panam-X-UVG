import { Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Home from '../pages/Home.jsx'
import Catalog from '../pages/Catalog.jsx'
import Customizer from '../pages/Customizer.jsx'
import Cart from '../pages/Cart.jsx'
import Checkout from '../pages/Checkout.jsx'
import OrderConfirmation from '../pages/OrderConfirmation.jsx'
import Tracking from '../pages/Tracking.jsx'
import Placeholder from '../pages/Placeholder.jsx'
import NotFound from '../pages/NotFound.jsx'

const upcomingPages = [
  {
    path: 'administracion',
    eyebrow: 'Administración',
    title: 'Todo bajo control.',
    description: 'Este espacio reunirá las herramientas para administrar productos y pedidos de la tienda.',
    next: 'El panel administrativo se desarrollará en una siguiente etapa.',
  },
]

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
        {upcomingPages.map(({ path, ...content }) => (
          <Route key={path} path={path} element={<Placeholder {...content} />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
