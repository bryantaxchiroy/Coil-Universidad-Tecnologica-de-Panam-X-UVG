import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // Keep localhost at /; GitHub Pages serves the production build from this subpath.
  base: command === 'build' ? '/Coil-Universidad-Tecnologica-de-Panam-X-UVG/' : '/',
  plugins: [react(), tailwindcss()],
}))
