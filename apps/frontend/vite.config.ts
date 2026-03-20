import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: '.', 
  plugins: [react()],
  resolve: {
    alias: {
      // Direct alias to the ESM build to bypass the "Missing specifier" error
      'react-map-gl': path.resolve(__dirname, './node_modules/react-map-gl/dist/esm/index.js'),
    },
  },
  optimizeDeps: {
    // Forces Vite to pre-bundle these so Rollup doesn't struggle with the entry point
    include: ['react-map-gl', 'mapbox-gl']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
})