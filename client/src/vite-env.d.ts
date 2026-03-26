/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string
  readonly PUBLIC_APP_URL: string
  readonly PUBLIC_ADMIN_URL: string
  readonly PUBLIC_CLIENT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
