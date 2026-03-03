/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  /** Enable debug overlay and console logging */
  readonly VITE_DEBUG_MODE: string;
  /** Development mode flag */
  readonly VITE_DEV_MODE: string;
  /** Gemini API key */
  readonly VITE_GEMINI_API_KEY: string;
  /** Maximum FPS for rendering */
  readonly VITE_MAX_FPS: string;
  /** Auto-connect MIDI on startup */
  readonly VITE_MIDI_AUTO_CONNECT: string;
  /** Temporary transition flag for legacy custom controls */
  readonly VITE_ALLOW_LEGACY_CUSTOM_CONTROLS: string;
  /** JSON-encoded trusted community public keys */
  readonly VITE_COMMUNITY_TRUSTED_PUBLIC_KEYS: string;
  /** Comma-separated list of revoked community public key IDs */
  readonly VITE_COMMUNITY_REVOKED_PUBLIC_KEY_IDS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
