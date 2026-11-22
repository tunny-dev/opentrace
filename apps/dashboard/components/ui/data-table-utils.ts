export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API is blocked inside some iframes (e.g. the v0 preview).
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  // Neutralise spreadsheet formula injection for string values.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function rowsToCsv(rows: unknown[]): string {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
      if (seen.has(key) || (value !== null && typeof value === "object")) continue;
      seen.add(key);
      keys.push(key);
    }
  }
  const lines = rows.map((row) =>
    keys.map((key) => csvCell((row as Record<string, unknown>)[key])).join(",")
  );
  return [keys.map(csvCell).join(","), ...lines].join("\n");
}

/** Flat, lower-cased text used by the global search when no custom getter is given. */
export function defaultSearchText(row: unknown): string {
  if (!row || typeof row !== "object") return String(row ?? "");
  return Object.values(row as Record<string, unknown>)
    .filter((value) => value !== null && typeof value !== "object" && typeof value !== "function")
    .join(" ");
}

export type PageItem = number | "ellipsis-start" | "ellipsis-end";

export function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const items: PageItem[] = [0];
  const start = Math.max(1, Math.min(current - 1, total - 4));
  const end = Math.min(total - 2, Math.max(current + 1, 3));
  if (start > 1) items.push("ellipsis-start");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 2) items.push("ellipsis-end");
  items.push(total - 1);
  return items;
}
