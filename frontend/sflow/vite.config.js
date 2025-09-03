import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        landing: 'landing.html',
        signup: 'signup.html',
        login: 'login.html',
        dashboard: 'dashboard.html'
      }
    }
  }
})