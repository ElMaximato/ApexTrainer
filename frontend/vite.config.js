import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // semantic-ui-css trae un selector que el minificador por defecto rechaza
    cssMinify: false,
  },
})