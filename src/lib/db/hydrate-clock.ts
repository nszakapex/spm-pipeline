/** Process-local clock so tabbing does not re-run overnight persist on every request. */
export const HYDRATE_TTL_MS = 20_000;

let lastSuccessfulHydrateAt = 0;

export function markHydrateFresh(now = Date.now()): void {
  lastSuccessfulHydrateAt = now;
}

export function resetHydrateClock(): void {
  lastSuccessfulHydrateAt = 0;
}

export function isHydrateFresh(now = Date.now(), ttlMs = HYDRATE_TTL_MS): boolean {
  return lastSuccessfulHydrateAt > 0 && now - lastSuccessfulHydrateAt < ttlMs;
}
