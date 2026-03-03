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
  /** Optional URL to fetch remote trust store snapshot */
  readonly VITE_COMMUNITY_TRUST_STORE_URL: string;
  /** Fetch timeout (ms) for remote trust store URL */
  readonly VITE_COMMUNITY_TRUST_STORE_FETCH_TIMEOUT_MS: string;
  /** Runtime cache TTL (ms) for trust store snapshot */
  readonly VITE_COMMUNITY_TRUST_STORE_CACHE_TTL_MS: string;
  /** Minimum accepted trust store semver */
  readonly VITE_COMMUNITY_TRUST_STORE_MIN_VERSION: string;
  /** Trusted root public keys for trust store metadata signature verification */
  readonly VITE_COMMUNITY_TRUST_STORE_ROOT_PUBLIC_KEYS: string;
  /** Revoked root key IDs for trust store metadata signature verification */
  readonly VITE_COMMUNITY_TRUST_STORE_REVOKED_ROOT_KEY_IDS: string;
  /** Require signature verification for remote trust store documents */
  readonly VITE_COMMUNITY_TRUST_STORE_REQUIRE_SIGNATURE: string;
  /** Grace period in milliseconds for root key rotation */
  readonly VITE_COMMUNITY_TRUST_STORE_ROOT_ROTATION_GRACE_MS: string;
  /** Optional URL for centralized community revocation deltas */
  readonly VITE_COMMUNITY_TRUST_STORE_REVOCATION_URL: string;
  /** Runtime TTL for centralized revocation snapshot */
  readonly VITE_COMMUNITY_TRUST_STORE_REVOCATION_CACHE_TTL_MS: string;
  /** Base URL for external core-renderers worker files */
  readonly VITE_MARKETPLACE_CORE_RENDERERS_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
