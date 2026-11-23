/**
 * Safely inlines JSON parameters into T-SQL query string for instant copy & paste.
 */
export function inlineSqlParameters(sql, paramsJson) {
  if (!sql) return '';
  if (!paramsJson) return sql;
  try {
    const params = typeof paramsJson === 'string' ? JSON.parse(paramsJson) : paramsJson;
    let inlined = sql;
    const keys = Object.keys(params).sort((a, b) => b.length - a.length);
    for (const rawKey of keys) {
      const keyName = rawKey.startsWith('@') ? rawKey : `@${rawKey}`;
      const val = params[rawKey];
      let valStr = 'NULL';
      if (val === null || val === undefined) {
        valStr = 'NULL';
      } else if (typeof val === 'number') {
        valStr = String(val);
      } else if (typeof val === 'boolean') {
        valStr = val ? '1' : '0';
      } else {
        valStr = `'${String(val).replace(/'/g, "''")}'`;
      }
      const regex = new RegExp(`(?<=[^a-zA-Z0-9_@]|^)${keyName}(?=[^a-zA-Z0-9_]|$)`, 'gi');
      inlined = inlined.replace(regex, valStr);
    }
    return inlined;
  } catch {
    return sql;
  }
}

/**
 * Case-insensitive lookup helper for data rows
 * Handles differences between SQL column names (PascalCase/UPPER) and JSON serializer keys (camelCase)
 */
export function getRowValue(row, colName) {
  if (!row || colName === null || colName === undefined) return undefined;
  if (row[colName] !== undefined) return row[colName];

  // Hỗ trợ fallback tương thích trường hợp cột không có alias giữa các phiên bản
  if (colName === '(No column name)' && row[''] !== undefined) {
    return row[''];
  }
  if (colName === '' && row['(No column name)'] !== undefined) {
    return row['(No column name)'];
  }

  const lower = String(colName).toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.toLowerCase() === lower) {
      return row[key];
    }
  }
  return undefined;
}

/**
 * Bọc câu lệnh SQL với SET STATISTICS IO, TIME ON / OFF
 * Phục vụ debug đo đạc hiệu năng trực tiếp trên SSMS / Azure Data Studio / DBeaver
 */
export function wrapWithStatistics(sql) {
  if (!sql) return '';
  const trimmed = sql.trim();
  return `SET STATISTICS IO ON;
SET STATISTICS TIME ON;

${trimmed}

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;`;
}
