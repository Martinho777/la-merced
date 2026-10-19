import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'supabase/.temp', 'src/lib/tipos-db.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      // Toda consulta a Supabase pasa por src/datos/ (ver README).
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message: 'Usa las funciones de src/datos/ en lugar de llamar a Supabase directo.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/lib/**', 'src/datos/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  prettier,
])
