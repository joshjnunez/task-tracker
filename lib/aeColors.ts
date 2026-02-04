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
