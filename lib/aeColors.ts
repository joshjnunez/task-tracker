export const AE_MUTED_PALETTE: string[] = [
  "#CBD5E1",
  "#BFDBFE",
  "#A7F3D0",
  "#FED7AA",
  "#E9D5FF",
  "#FBCFE8",
  "#C7D2FE",
  "#BBF7D0",
  "#E2E8F0",
  "#DDD6FE",
];

const paletteSet = new Set(AE_MUTED_PALETTE);
if (AE_MUTED_PALETTE.length !== 10 || paletteSet.size !== AE_MUTED_PALETTE.length) {
  const msg = "AE_MUTED_PALETTE must contain exactly 10 unique colors";
  if (process.env.NODE_ENV === "production") {
    console.warn(msg, { length: AE_MUTED_PALETTE.length, unique: paletteSet.size });
  } else {
    throw new Error(msg);
  }
}

export function pickDeterministicAEColor(name: string): string {
  const s = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return AE_MUTED_PALETTE[hash % AE_MUTED_PALETTE.length];
}

export function resolveAEColor(name: string, color?: string | null): string {
  if (color && color.trim().length) return color;
  return pickDeterministicAEColor(name);
}
