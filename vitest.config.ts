import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Config separada de vite.config.ts (que sigue siendo la única fuente de
// verdad para el build de producción) — mismo plugin, para que los tests
// compilen JSX/TS exactamente igual que el build real, pero con el bloque
// `test` que vite.config.ts no necesita para nada fuera de tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
