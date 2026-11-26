import { fileURLToPath, URL } from 'node:url'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * Solo en `npm run dev`: atiende POST /api/publicar con la misma función que usa Vercel
 * (api/publicar.ts), para probar «Publicar» en local. Las variables salen de .env.local.
 */
function funcionesLocales(): Plugin {
  return {
    name: 'la-merced:funciones-locales',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      server.middlewares.use('/api/publicar', async (req, res) => {
        try {
          const modulo = (await server.ssrLoadModule('/api/publicar.ts')) as {
            POST: (r: Request) => Promise<Response>
          }
          const cabeceras = new Headers()
          for (const [clave, valor] of Object.entries(req.headers)) {
            if (typeof valor === 'string') cabeceras.set(clave, valor)
          }
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end()
            return
          }
          const respuesta = await modulo.POST(
            new Request(`http://localhost${req.url ?? ''}`, { method: 'POST', headers: cabeceras }),
          )
          res.statusCode = respuesta.status
          respuesta.headers.forEach((valor, clave) => res.setHeader(clave, valor))
          res.end(await respuesta.text())
        } catch (error) {
          res.statusCode = 500
          res.end(String(error))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // `npm run dev:https` (modo "https"): HTTPS local con certificado autofirmado, para probar la
  // cámara desde el teléfono. Solo desarrollo; `npm run dev` y el build no cambian.
  plugins: [react(), funcionesLocales(), ...(mode === 'https' ? [basicSsl()] : [])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
}))
