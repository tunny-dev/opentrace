"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const SQL_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "OUTER",
  "CROSS",
  "ON",
  "GROUP",
  "BY",
  "ORDER",
  "HAVING",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "DISTINCT",
  "TOP",
  "LIMIT",
  "OFFSET",
  "UNION",
  "ALL",
  "AS",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "EXISTS",
  "IN",
  "LIKE",
  "IS",
  "NOT",
  "NULL",
  "BETWEEN",
  "EXEC",
  "EXECUTE",
  "DECLARE",
  "MERGE",
  "USING",
  "MATCHED",
  "WITH",
  "NOLOCK",
]);

const SQL_FUNCTIONS = new Set([
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "ISNULL",
  "COALESCE",
  "DATEADD",
  "DATEDIFF",
  "GETDATE",
  "GETUTCDATE",
  "CONVERT",
  "CAST",
  "ROW_NUMBER",
  "OVER",
  "PARTITION",
  "SUBSTRING",
  "LEN",
  "TRIM",
  "ROUND",
  "FLOOR",
  "CEILING",
  "ABS",
  "DAY",
  "MONTH",
  "YEAR",
]);

/**
 * Tokenize a single line of SQL and highlight syntax elements
 */
function highlightSqlLine(line: string): React.ReactNode[] {
  // Regex to match: comments (--...), strings ('...'), parameters (@...), words, numbers, punctuation
  const tokenRegex = /(--.*$|\/\*[\s\S]*?\*\/|'[^']*'|@[a-zA-Z0-9_]+|\b\d+(\.\d+)?\b|[a-zA-Z_][a-zA-Z0-9_]*|[^\s\w])/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    // Append whitespace before token
    if (match.index > lastIndex) {
      elements.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    const upper = token.toUpperCase();

    if (token.startsWith("--") || token.startsWith("/*")) {
      elements.push(
        <span key={match.index} className="text-slate-500 dark:text-slate-400 italic font-mono">
          {token}
        </span>
      );
    } else if (token.startsWith("'")) {
      elements.push(
        <span key={match.index} className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
          {token}
        </span>
      );
    } else if (token.startsWith("@")) {
      elements.push(
        <span key={match.index} className="text-purple-600 dark:text-purple-400 font-mono font-semibold">
          {token}
        </span>
      );
    } else if (/^\d+(\.\d+)?$/.test(token)) {
      elements.push(
        <span key={match.index} className="text-amber-600 dark:text-amber-400 font-mono font-medium">
          {token}
        </span>
      );
    } else if (SQL_KEYWORDS.has(upper)) {
      elements.push(
        <span key={match.index} className="text-blue-600 dark:text-sky-400 font-mono font-bold">
          {upper}
        </span>
      );
    } else if (SQL_FUNCTIONS.has(upper)) {
      elements.push(
        <span key={match.index} className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
          {upper}
        </span>
      );
    } else {
      elements.push(token);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Append remaining text
  if (lastIndex < line.length) {
    elements.push(line.slice(lastIndex));
  }

  return elements;
}

export function SqlCodeBlock({
  sql,
  className,
  showLineNumbers = true,
}: {
  sql: string;
  className?: string;
  showLineNumbers?: boolean;
}) {
  const cleanSql = React.useMemo(() => {
    if (!sql) return "";
    // Unescape literal \r\n if needed
    return sql.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
  }, [sql]);

  const lines = React.useMemo(() => {
    return cleanSql.split("\n");
  }, [cleanSql]);

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-muted/30 dark:bg-[#0c1017] dark:border-[#22252b] text-foreground font-mono text-xs leading-relaxed overflow-x-auto shadow-inner select-text",
        className
      )}
    >
      <div className="py-2.5 px-3">
        {lines.map((line, idx) => (
          <div key={idx} className="flex items-start hover:bg-muted/40 transition-colors">
            {showLineNumbers && (
              <span className="w-8 shrink-0 text-right pr-3 text-[11px] font-mono text-muted-foreground/50 select-none tabular-nums">
                {idx + 1}
              </span>
            )}
            <div className="flex-1 whitespace-pre font-mono text-xs">
              {line.trim() === "" ? "\u00A0" : highlightSqlLine(line)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
