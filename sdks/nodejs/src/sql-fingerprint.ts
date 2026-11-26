const STRING_LITERAL = /'(?:''|\\.|[^'\\])*'/g
const NUMBER_LITERAL = /\b(?:0x[\da-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/gi
const COMMENT = /--[^\n]*|\/\*[\s\S]*?\*\//g
const IN_LIST = /\bin\s*\(\s*(?:\?\s*,\s*)+\?\s*\)/gi

export function fingerprintSql(sql: string): string {
  return sql
    .replace(COMMENT, " ")
    .replace(STRING_LITERAL, "?")
    .replace(NUMBER_LITERAL, "?")
    .replace(/\b(?:true|false|null)\b/gi, "?")
    .replace(IN_LIST, "IN (?)")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function fingerprintError(name: string, message: string): string {
  const normalized = message
    .replace(/\b0x[\da-f]+\b/gi, "#")
    .replace(/\b\d+\b/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()

  return `${name.toLowerCase()}: ${normalized}`
}
