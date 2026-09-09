import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

function normalizeBasePath(value: string): string {
  if (!value || value === '/') {
    return '/'
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: normalizeBasePath(env.VITE_BASE_PATH || '/'),
    plugins: [react()],
    server: {
      port: 4173,
    },
    build: {
      target: 'es2022',
    },
  }
})
