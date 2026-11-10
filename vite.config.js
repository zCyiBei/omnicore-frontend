import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: 
    [vue(),
    tailwindcss(),
  ],
  server: {
    cors: false,
    proxy: {
      '/api': {
        target: 'https://fitcron-api.onrender.com',
        changeOrigin:true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
