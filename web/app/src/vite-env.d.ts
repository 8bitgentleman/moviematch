/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VERSION: string;
  readonly VITE_API_URI?: string;
  readonly VITE_ROOT_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
