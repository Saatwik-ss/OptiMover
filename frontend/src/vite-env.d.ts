/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ANALYTICS_KEY?: string;
  readonly VITE_ENABLE_AI_ANALYSIS?: string;
  readonly VITE_ENABLE_GAME_REPLAY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
