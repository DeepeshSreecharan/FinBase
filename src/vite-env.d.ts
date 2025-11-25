/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // add other VITE_ vars here if you want autocomplete
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
