const TOKEN_PATTERN =
  /--[^\n]*|'(?:''|\\.|[^'\\])*'|\b(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|AND|OR|NOT|NULL|IN|IS|SET|VALUES|RETURNING|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|CASE|WHEN|THEN|ELSE|END|COUNT|SUM|AVG|DISTINCT|WITH|UNION|ALL|ASC|DESC)\b|\b\d+(?:\.\d+)?\b|\?/gi;

function tokenClass(token: string) {
  if (token.startsWith("--")) return "sql-token-comment";
  if (token.startsWith("'")) return "sql-token-string";
  if (token === "?") return "sql-token-parameter";
  if (/^\d/.test(token)) return "sql-token-number";
  return "sql-token-keyword";
}

export function SqlSyntax({ sql }: { sql: string }) {
  const tokens = [...sql.matchAll(TOKEN_PATTERN)];
  let cursor = 0;
  const parts: Array<{ value: string; className?: string }> = [];

  for (const token of tokens) {
    const index = token.index ?? cursor;
    if (index > cursor) parts.push({ value: sql.slice(cursor, index) });
    parts.push({ value: token[0], className: tokenClass(token[0]) });
    cursor = index + token[0].length;
  }
  if (cursor < sql.length) parts.push({ value: sql.slice(cursor) });

  return (
    <code className="sql-syntax">
      {parts.map((part, index) =>
        part.className ? (
          <span className={part.className} key={`${index}-${part.value}`}>
            {part.value}
          </span>
        ) : (
          <span key={`${index}-${part.value}`}>{part.value}</span>
        )
      )}
    </code>
  );
}
