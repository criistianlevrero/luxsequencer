export interface MarketplaceLicenseClaims {
  sub: string;
  pluginKey: string;
  iat: number;
  exp: number;
}

function base64UrlToString(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  return decodeURIComponent(
    Array.from(atob(padded))
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
}

export function decodeMarketplaceLicenseClaims(token: string): MarketplaceLicenseClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlToString(parts[1]));

    if (
      !payload
      || typeof payload !== 'object'
      || typeof payload.sub !== 'string'
      || typeof payload.pluginKey !== 'string'
      || typeof payload.iat !== 'number'
      || typeof payload.exp !== 'number'
    ) {
      return null;
    }

    return payload as MarketplaceLicenseClaims;
  } catch {
    return null;
  }
}

export function isMarketplaceLicenseTokenValid(
  token: string,
  expectedPluginKey: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const claims = decodeMarketplaceLicenseClaims(token);
  if (!claims) {
    return false;
  }

  if (claims.pluginKey !== expectedPluginKey) {
    return false;
  }

  if (claims.exp <= nowSeconds) {
    return false;
  }

  if (claims.iat > nowSeconds + 120) {
    return false;
  }

  return true;
}
