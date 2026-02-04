export function isMissingAccount(account?: string | null): boolean {
  if (account == null) return true;
  const trimmed = account.trim();
  if (!trimmed.length) return true;
  return trimmed.toLowerCase() === "unassigned";
}

export function formatAccountName(account?: string | null): string {
  return isMissingAccount(account) ? "–" : String(account).trim();
}
