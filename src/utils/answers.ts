/**
 * Parse an answer option string such as "12.5 J", "3.0e8 m/s" or "-4 N"
 * into a numeric value and a trailing unit. Falls back to a null value when
 * no number can be extracted.
 */
export function parseValueAndUnit(raw: string): {
  value: number | null;
  unit: string;
} {
  const trimmed = raw.trim();
  const match = trimmed.match(/^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/);
  if (!match) {
    return { value: null, unit: trimmed };
  }
  const value = Number(match[0]);
  const unit = trimmed.slice(match[0].length).trim();
  return { value: Number.isFinite(value) ? value : null, unit };
}

/** Deterministic pseudo-shuffle seeded by a string so option order is stable. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
