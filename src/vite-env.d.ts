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
  /** Enable graphics pipeline v2 (worker + compositor) */
  readonly VITE_GRAPHICS_PIPELINE_V2: string;
  /** Temporary transition flag for legacy custom controls */
  readonly VITE_ALLOW_LEGACY_CUSTOM_CONTROLS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
