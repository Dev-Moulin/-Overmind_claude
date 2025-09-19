import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      deny: ['../blender/three.js-dev/**']  // ✅ Ignorer version dev
    }
  }
})