/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL — when absent, accounts & sync are disabled and the app works offline only. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (public) key — safe to expose; data access is restricted by row-level security. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
