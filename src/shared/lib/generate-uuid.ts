export function generateUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Fallback for environments where crypto.randomUUID is unavailable
  // (e.g. http://<lan-ip>:port insecure contexts, or crypto being
  // entirely absent). We must not assume crypto.getRandomValues exists
  // either — fall back to Math.random() as a last resort.
  const getRandomByte: () => number =
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
      ? () => crypto.getRandomValues(new Uint8Array(1))[0]
      : () => Math.floor(Math.random() * 256);

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (getRandomByte() & (15 >> (Number(c) / 4)))).toString(16),
  );
}