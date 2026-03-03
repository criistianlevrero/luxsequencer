/**
 * Environment configuration
 * 
 * This file provides type-safe access to environment variables.
 * All environment variables must be prefixed with VITE_ to be exposed to the client.
 * 
 * @see https://vitejs.dev/guide/env-and-mode.html
 */

interface EnvConfig {
  /** Enable debug overlay and console logging */
  debugMode: boolean;
  /** Development mode flag */
  devMode: boolean;
  /** Gemini API key (if configured) */
  geminiApiKey?: string;
  /** Maximum FPS for rendering */
  maxFps: number;
  /** Auto-connect MIDI on startup */
  midiAutoConnect: boolean;
  /** Temporary transition flag for legacy custom controls in renderer controlSchema */
  allowLegacyCustomControls: boolean;
  /** JSON array with trusted community public keys (SPKI base64) */
  communityTrustedPublicKeysJson?: string;
  /** Explicitly revoked public key IDs for community package signatures */
  communityRevokedPublicKeyIds: string[];
  /** Optional remote URL for trust store distribution */
  communityTrustStoreUrl?: string;
  /** HTTP timeout for remote trust store fetch */
  communityTrustStoreFetchTimeoutMs: number;
  /** Runtime cache TTL for remote trust store snapshot */
  communityTrustStoreCacheTtlMs: number;
  /** Optional minimum accepted remote trust store version */
  communityTrustStoreMinVersion?: string;
  /** JSON array with trusted root keys used to verify remote trust store metadata signatures */
  communityTrustStoreRootPublicKeysJson?: string;
  /** Explicitly revoked root key IDs for trust store metadata signatures */
  communityTrustStoreRevokedRootKeyIds: string[];
  /** Require cryptographic signature for remote trust store documents */
  communityTrustStoreRequireSignature: boolean;
  /** Grace period (ms) to allow recently expired root keys during rotation */
  communityTrustStoreRootRotationGraceMs: number;
  /** Debug categories for fine-grained control */
  debug: {
    /** Sequencer timing and pattern loading */
    sequencer: boolean;
    /** Pattern animation and interpolation */
    animation: boolean;
    /** MIDI messages and mappings */
    midi: boolean;
    /** Property sequencer and keyframes */
    propertySequencer: boolean;
    /** Renderer validation and error handling */
    validation: boolean;
  };
}

/**
 * Parse boolean from environment variable string
 */
const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

/**
 * Parse number from environment variable string
 */
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseStringList = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

/**
 * Application environment configuration
 * Loads from environment variables with sensible defaults
 */
export const env: EnvConfig = {
  debugMode: parseBoolean(import.meta.env.VITE_DEBUG_MODE, false),
  devMode: parseBoolean(import.meta.env.VITE_DEV_MODE, import.meta.env.DEV),
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,
  maxFps: parseNumber(import.meta.env.VITE_MAX_FPS, 60),
  midiAutoConnect: parseBoolean(import.meta.env.VITE_MIDI_AUTO_CONNECT, true),
  allowLegacyCustomControls: parseBoolean(import.meta.env.VITE_ALLOW_LEGACY_CUSTOM_CONTROLS, false),
  communityTrustedPublicKeysJson: import.meta.env.VITE_COMMUNITY_TRUSTED_PUBLIC_KEYS,
  communityRevokedPublicKeyIds: parseStringList(import.meta.env.VITE_COMMUNITY_REVOKED_PUBLIC_KEY_IDS),
  communityTrustStoreUrl: import.meta.env.VITE_COMMUNITY_TRUST_STORE_URL,
  communityTrustStoreFetchTimeoutMs: parseNumber(import.meta.env.VITE_COMMUNITY_TRUST_STORE_FETCH_TIMEOUT_MS, 2500),
  communityTrustStoreCacheTtlMs: parseNumber(import.meta.env.VITE_COMMUNITY_TRUST_STORE_CACHE_TTL_MS, 300000),
  communityTrustStoreMinVersion: import.meta.env.VITE_COMMUNITY_TRUST_STORE_MIN_VERSION,
  communityTrustStoreRootPublicKeysJson: import.meta.env.VITE_COMMUNITY_TRUST_STORE_ROOT_PUBLIC_KEYS,
  communityTrustStoreRevokedRootKeyIds: parseStringList(import.meta.env.VITE_COMMUNITY_TRUST_STORE_REVOKED_ROOT_KEY_IDS),
  communityTrustStoreRequireSignature: parseBoolean(import.meta.env.VITE_COMMUNITY_TRUST_STORE_REQUIRE_SIGNATURE, true),
  communityTrustStoreRootRotationGraceMs: parseNumber(import.meta.env.VITE_COMMUNITY_TRUST_STORE_ROOT_ROTATION_GRACE_MS, 604800000),
  debug: {
    sequencer: parseBoolean(import.meta.env.VITE_DEBUG_SEQUENCER, false),
    animation: parseBoolean(import.meta.env.VITE_DEBUG_ANIMATION, false),
    midi: parseBoolean(import.meta.env.VITE_DEBUG_MIDI, false),
    propertySequencer: parseBoolean(import.meta.env.VITE_DEBUG_PROPERTY_SEQUENCER, false),
    validation: parseBoolean(import.meta.env.VITE_DEBUG_VALIDATION, false),
  },
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

/**
 * Get the current mode (development, production, etc.)
 */
export const getMode = (): string => {
  return import.meta.env.MODE;
};

/**
 * Log environment configuration (only in development)
 */
export const logEnvConfig = (): void => {
  if (isDevelopment()) {
    return;
  }
};

// Alias for backwards compatibility
export const config = env;
