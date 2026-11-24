/**
 * SpurTrace Observability - Standard APM Duration Formatter (Grafana / Datadog Standard)
 * Provides clean, adaptive human-readable duration strings and cleans floating-point artifacts.
 */

/**
 * Formats a duration in milliseconds into an adaptive, human-friendly string:
 * - 0 ms -> "0 ms"
 * - < 0.01 ms -> "< 0.01 ms"
 * - < 1 ms -> "0.xx ms" (e.g. "0.45 ms")
 * - 1 ms .. < 10 ms -> "x.x ms" (e.g. "4.8 ms")
 * - 10 ms .. < 1,000 ms -> "xx ms" (e.g. "45 ms", "771 ms")
 * - 1,000 ms .. < 60,000 ms -> "x.xx s" (e.g. "1.38 s", "14.20 s")
 * - >= 60,000 ms -> "x m y s" (e.g. "1m 24s")
 */
export function formatDuration(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || isNaN(ms)) return "0 ms";
  const abs = Math.abs(ms);

  if (abs === 0) return "0 ms";
  if (abs < 0.01) return "< 0.01 ms";

  if (abs < 1) {
    return `${Number(ms.toFixed(2))} ms`;
  }

  if (abs < 10) {
    return `${Number(ms.toFixed(1))} ms`;
  }

  if (abs < 1000) {
    return `${Math.round(ms)} ms`;
  }

  if (abs < 60000) {
    const s = ms / 1000;
    return `${s.toFixed(2)} s`;
  }

  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

/**
 * Rounds a floating-point millisecond number to at most 2 decimal places.
 * Eliminates IEEE-754 precision artifacts (e.g. 483.54459999999995 -> 483.54).
 */
export function roundDuration(ms: number | undefined | null): number {
  if (ms === undefined || ms === null || isNaN(ms)) return 0;
  return Math.round(ms * 100) / 100;
}
