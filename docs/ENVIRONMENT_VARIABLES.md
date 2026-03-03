# Environment Variables Guide

This document describes the environment variables used in the LuxSequencer application.

## Setup

### Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` to customize your local configuration:
   ```bash
   nano .env
   # or
   vim .env
   # or open in your editor
   ```

3. Restart the dev server for changes to take effect:
   ```bash
   npm run dev
   ```

### Production

For production builds, environment variables should be set in your deployment platform or CI/CD pipeline.

**Important:** Never commit `.env` files with sensitive data to version control. The `.env` file is ignored by git.

## Available Variables

All environment variables must be prefixed with `VITE_` to be exposed to the client-side application.

### `VITE_DEBUG_MODE`

- **Type:** Boolean (`true` | `false`)
- **Default:** `false`
- **Description:** Enables the debug overlay and console logging features

When enabled:
- Shows the debug overlay (purple bug icon) in the bottom-right corner
- Logs environment configuration on startup

**Development:**
```env
VITE_DEBUG_MODE=true
```

**Production:**
```env
VITE_DEBUG_MODE=false
```

### Debug Categories (Fine-grained Control)

These variables allow you to enable debug logging for specific subsystems, reducing console noise:

#### `VITE_DEBUG_SEQUENCER`

- **Type:** Boolean (`true` | `false`)
- **Default:** `false`
- **Description:** Logs sequencer timing, pattern loading, and step changes

Useful for debugging:
- Sequencer timing drift
- Pattern transitions
- Step-by-step execution

```env
VITE_DEBUG_SEQUENCER=true
```

#### `VITE_DEBUG_ANIMATION`

- **Type:** Boolean (`true` | `false`)
- **Default:** `false`
- **Description:** Logs pattern animation and interpolation details

Useful for debugging:
- `animateOnlyChanges` behavior
- Property interpolation
- Animation frame timing
- Settings transitions

```env
VITE_DEBUG_ANIMATION=true
```

#### `VITE_DEBUG_MIDI`

- **Type:** Boolean (`true` | `false`)
- **Default:** `false`
- **Description:** Logs MIDI messages and mappings

Useful for debugging:
- MIDI CC messages
- Note on/off events
- MIDI learn process
- Controller mappings

```env
VITE_DEBUG_MIDI=true
```

#### `VITE_DEBUG_PROPERTY_SEQUENCER`

- **Type:** Boolean (`true` | `false`)
- **Default:** `false`
- **Description:** Logs property sequencer keyframe interpolation and automation

Useful for debugging:
- Keyframe calculations
- Property automation
- Track-based sequencing

```env
VITE_DEBUG_PROPERTY_SEQUENCER=true
```

**💡 Tip:** Enable only the categories you need to keep logs focused and readable.

### `VITE_DEV_MODE`

- **Type:** Boolean (`true` | `false`)
- **Default:** Auto-detected from Vite build mode
- **Description:** Development mode flag for additional development features

### `VITE_MAX_FPS`

- **Type:** Number
- **Default:** `60`
- **Description:** Maximum frames per second for rendering

Useful for performance testing or limiting rendering on lower-end devices:

```env
VITE_MAX_FPS=30
```

### `VITE_MIDI_AUTO_CONNECT`

- **Type:** Boolean (`true` | `false`)
- **Default:** `true`
- **Description:** Automatically connect to MIDI devices on startup

Set to `false` to require manual MIDI connection:

```env
VITE_MIDI_AUTO_CONNECT=false
```

### `VITE_ALLOW_LEGACY_CUSTOM_CONTROLS`

- **Type:** Boolean (`true` | `false`)
- **Default:** `false`
- **Description:** Transitional flag to allow legacy `controlSchema` controls with `type: 'custom'`

Recommended value is `false` to enforce the declarative-only policy for renderer controls.
Enable only as a temporary migration fallback.

```env
VITE_ALLOW_LEGACY_CUSTOM_CONTROLS=false
```

### `VITE_COMMUNITY_TRUSTED_PUBLIC_KEYS`

- **Type:** JSON array (string)
- **Default:** `[]`
- **Description:** Trusted public keys for verifying community renderer package signatures.

Each entry supports key rotation metadata:
- `id`: key identifier referenced by `packageManifest.security.workerEntrySignature.publicKeyId`
- `spkiBase64`: public key encoded as SPKI base64
- `status`: `active` | `revoked`
- `notBefore` / `notAfter`: optional ISO date validity window
- `replacedBy`: optional next key ID for rotation guidance

```env
VITE_COMMUNITY_TRUSTED_PUBLIC_KEYS=[{"id":"community-key-2026-q1","spkiBase64":"MIIB...","status":"active","notBefore":"2026-01-01T00:00:00Z","notAfter":"2026-12-31T23:59:59Z","replacedBy":"community-key-2027-q1"}]
```

### `VITE_COMMUNITY_REVOKED_PUBLIC_KEY_IDS`

- **Type:** Comma-separated string
- **Default:** empty
- **Description:** Explicitly revoked key IDs. This list overrides key status and blocks signature verification.

```env
VITE_COMMUNITY_REVOKED_PUBLIC_KEY_IDS=community-key-2025-q4,community-key-2026-q1
```

### `VITE_COMMUNITY_TRUST_STORE_URL`

- **Type:** String (URL)
- **Default:** empty (disabled)
- **Description:** Remote endpoint for trust store distribution. If empty, only local trust store sources are used.

Expected JSON payload:

```json
{
   "schemaVersion": "1.0.0",
   "version": "1.2.0",
   "keys": [
      {
         "id": "community-key-2026-q1",
         "spkiBase64": "MIIB...",
         "status": "active",
         "notBefore": "2026-01-01T00:00:00Z",
         "notAfter": "2026-12-31T23:59:59Z"
      }
   ],
   "revokedKeyIds": ["community-key-2025-q4"]
}
```

### `VITE_COMMUNITY_TRUST_STORE_FETCH_TIMEOUT_MS`

- **Type:** Number (milliseconds)
- **Default:** `2500`
- **Description:** Timeout for remote trust store fetch.

### `VITE_COMMUNITY_TRUST_STORE_CACHE_TTL_MS`

- **Type:** Number (milliseconds)
- **Default:** `300000`
- **Description:** Runtime freshness TTL for remote trust store snapshot. On fetch failure, cached snapshot fallback is used when available.

### `VITE_COMMUNITY_TRUST_STORE_MIN_VERSION`

- **Type:** Semver string
- **Default:** empty
- **Description:** Minimum accepted version for remote trust store documents.

### `VITE_COMMUNITY_TRUST_STORE_REQUIRE_SIGNATURE`

- **Type:** Boolean (`true` | `false`)
- **Default:** `true`
- **Description:** Requires cryptographic signature validation for remote trust store documents. When enabled, unsigned or invalidly signed payloads are rejected.

```env
VITE_COMMUNITY_TRUST_STORE_REQUIRE_SIGNATURE=true
```

### `VITE_COMMUNITY_TRUST_STORE_ROOT_PUBLIC_KEYS`

- **Type:** JSON array (string)
- **Default:** `[]`
- **Description:** Root public keys used to verify the remote trust store document signature.

```env
VITE_COMMUNITY_TRUST_STORE_ROOT_PUBLIC_KEYS=[{"id":"trust-root-2026-q1","spkiBase64":"MIIB...","status":"active"}]
```

### `VITE_COMMUNITY_TRUST_STORE_REVOKED_ROOT_KEY_IDS`

- **Type:** Comma-separated string
- **Default:** empty
- **Description:** Explicitly revoked root key IDs for trust store document signature verification.

```env
VITE_COMMUNITY_TRUST_STORE_REVOKED_ROOT_KEY_IDS=trust-root-2025-q4
```

### `VITE_COMMUNITY_TRUST_STORE_ROOT_ROTATION_GRACE_MS`

- **Type:** Number (milliseconds)
- **Default:** `604800000` (7 days)
- **Description:** Grace period for automatic root key rotation. Recently expired root keys with `replacedBy` remain temporarily valid within this window.

```env
VITE_COMMUNITY_TRUST_STORE_ROOT_ROTATION_GRACE_MS=604800000
```

### `VITE_COMMUNITY_TRUST_STORE_REVOCATION_URL`

- **Type:** String (URL)
- **Default:** empty (disabled)
- **Description:** Dedicated endpoint for centralized revocation deltas. The list is merged into runtime revocations with precedence over local/remote key status.

```env
VITE_COMMUNITY_TRUST_STORE_REVOCATION_URL=https://security.example.com/lux/revocations.json
```

### `VITE_COMMUNITY_TRUST_STORE_REVOCATION_CACHE_TTL_MS`

- **Type:** Number (milliseconds)
- **Default:** `120000`
- **Description:** Runtime freshness TTL for centralized revocation snapshot. Falls back to cached snapshot on network failure.

```env
VITE_COMMUNITY_TRUST_STORE_REVOCATION_CACHE_TTL_MS=120000
```

### `VITE_GEMINI_API_KEY`

- **Type:** String
- **Default:** None
- **Description:** API key for Gemini integration (if needed)

**⚠️ Security Warning:** Never commit API keys to version control!

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

## Usage in Code

### Import the configuration

```typescript
import { env, isDevelopment, isProduction, logEnvConfig } from './config';
```

### Access environment variables

```typescript
// Check if debug mode is enabled
if (env.debugMode) {
  console.log('Debug mode is active');
}

// Check development/production mode
if (isDevelopment()) {
  console.log('Running in development');
}

if (isProduction()) {
  console.log('Running in production');
}

// Log full configuration (only in development)
logEnvConfig();
```

### Type-safe access

The `env` object provides fully typed access to all environment variables:

```typescript
const maxFps: number = env.maxFps;
const debugMode: boolean = env.debugMode;
const apiKey: string | undefined = env.geminiApiKey;
```

## Adding New Variables

1. **Add to `.env.example`:**
   ```env
   VITE_NEW_VARIABLE=default_value
   ```

2. **Add TypeScript type in `vite-env.d.ts`:**
   ```typescript
   interface ImportMetaEnv {
     // ... existing variables
     readonly VITE_NEW_VARIABLE: string;
   }
   ```

3. **Add to config in `config.ts`:**
   ```typescript
   export const env: EnvConfig = {
     // ... existing properties
     newVariable: import.meta.env.VITE_NEW_VARIABLE,
   };
   ```

4. **Update this documentation** with the new variable details

## Best Practices

1. **Never commit sensitive data:** Always use `.env.example` with placeholder values
2. **Use defaults:** Provide sensible defaults in `config.ts` for all variables
3. **Document changes:** Update this guide when adding new variables
4. **Prefix with VITE_:** All client-side variables must start with `VITE_`
5. **Type safety:** Always use the `env` object from `config.ts` for type safety

## Troubleshooting

### Variables not updating

1. Restart the Vite dev server after changing `.env`:
   ```bash
   # Stop the server (Ctrl+C) then restart
   npm run dev
   ```

2. Clear the browser cache and hard reload (Ctrl+Shift+R)

### Variable is undefined

1. Check that the variable is prefixed with `VITE_`
2. Verify the variable is defined in `.env`
3. Restart the dev server
4. Check `vite-env.d.ts` has the type definition

### Debug mode not working

1. Check `.env` has `VITE_DEBUG_MODE=true`
2. Restart dev server
3. Check browser console for environment configuration log
4. Verify no errors in the console

## References

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [TypeScript Environment Variables](https://vitejs.dev/guide/env-and-mode.html#intellisense-for-typescript)
