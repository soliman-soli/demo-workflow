import type { MozakraOverviewSuccess } from "./schemas";

const OVERVIEW_CACHE_TTL_MS = 60_000;

let cachedOverview: { data: MozakraOverviewSuccess; expiresAt: number } | null =
  null;

export function getCachedMozakraOverview(
  now = Date.now()
): MozakraOverviewSuccess | null {
  if (cachedOverview && cachedOverview.expiresAt > now) {
    return cachedOverview.data;
  }
  return null;
}

export function setCachedMozakraOverview(
  data: MozakraOverviewSuccess,
  now = Date.now()
): void {
  cachedOverview = { data, expiresAt: now + OVERVIEW_CACHE_TTL_MS };
}

export function clearMozakraOverviewCache(): void {
  cachedOverview = null;
}
