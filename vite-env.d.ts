/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_MT5_API_URL: string
  readonly VITE_MT5_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}