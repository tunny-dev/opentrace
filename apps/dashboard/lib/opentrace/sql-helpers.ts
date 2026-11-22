/**
 * OpenTrace Multi-Database Dialects & Conventions Helper
 * Ordered by strict system priority:
 * 1. PgSQL (PostgreSQL)
 * 2. MSSqlServer (Microsoft SQL Server)
 * 3. MySql (MySQL)
 * 4. SqlLite (SQLite)
 *
 * Version-agnostic: Designed to work across any standard database release.
 * Security: Enforces standard UUID for all primary keys (IDs).
 */

export type SupportedDbEngine = "postgres" | "mssql" | "mysql" | "sqlite";

export interface DbEngineMeta {
  id: SupportedDbEngine;
  name: string;
  shortLabel: string;
  priority: number;
  badgeColor: string;
  defaultPort: number;
  idType: string;
  idGenerator: string;
  quoteStyle: string;
  paramStyle: string;
  convention: string;
  explainCommand: string;
  schemaStrategy: string;
  sampleConnStr: string;
}

export const DB_ENGINE_PRIORITIES: DbEngineMeta[] = [
  {
    id: "postgres",
    name: "PostgreSQL (PgSQL)",
    shortLabel: "PgSQL",
    priority: 1,
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    defaultPort: 5432,
    idType: "UUID",
    idGenerator: "DEFAULT gen_random_uuid()",
    quoteStyle: '"identifier"',
    paramStyle: "$1, $2, $3 or :param",
    convention: "snake_case columns, lowercase table names, JSONB for metadata",
    explainCommand: "EXPLAIN (ANALYZE, BUFFERS, COSTS)",
    schemaStrategy:
      "Dedicated 'opentrace' schema namespace (CREATE SCHEMA IF NOT EXISTS opentrace)",
    sampleConnStr:
      "postgresql://opentrace_user:••••••••@10.1.60.15:5432/mes_production?sslmode=prefer&schema=opentrace",
  },
  {
    id: "mssql",
    name: "Microsoft SQL Server (MSSqlServer)",
    shortLabel: "MSSqlServer",
    priority: 2,
    badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
    defaultPort: 1433,
    idType: "UNIQUEIDENTIFIER",
    idGenerator: "DEFAULT NEWID()",
    quoteStyle: "[Identifier]",
    paramStyle: "@paramName",
    convention: "PascalCase or standard MES uppercase, square brackets, WITH (NOLOCK) hints",
    explainCommand: "SET STATISTICS IO, TIME ON",
    schemaStrategy: "Dedicated '[opentrace]' schema namespace (CREATE SCHEMA [opentrace])",
    sampleConnStr:
      "Server=10.1.60.12,1433;Database=MES_Production;User Id=sa;Password=••••••••;Encrypt=True;TrustServerCertificate=True;",
  },
  {
    id: "mysql",
    name: "MySQL (MySql)",
    shortLabel: "MySql",
    priority: 3,
    badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    defaultPort: 3306,
    idType: "CHAR(36) or VARCHAR(36)",
    idGenerator: "DEFAULT (UUID()) or app UUID v4",
    quoteStyle: "`identifier`",
    paramStyle: "? or :param",
    convention: "snake_case, backtick escaping, InnoDB engine with utf8mb4",
    explainCommand: "EXPLAIN ANALYZE",
    schemaStrategy: "Dedicated 'opentrace_db' database or 'opentrace_' table prefix",
    sampleConnStr:
      "mysql://opentrace:••••••••@10.1.60.18:3306/mes_production?charset=utf8mb4&ssl-mode=PREFERRED",
  },
  {
    id: "sqlite",
    name: "SQLite (SqlLite)",
    shortLabel: "SqlLite",
    priority: 4,
    badgeColor: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
    defaultPort: 0,
    idType: "TEXT",
    idGenerator: "UUID string (36-char)",
    quoteStyle: '"identifier"',
    paramStyle: "? or :param",
    convention: "snake_case, lightweight schema, WAL journal mode enabled",
    explainCommand: "EXPLAIN QUERY PLAN",
    schemaStrategy: "Self-contained single file with WAL mode (opentrace.sqlite3)",
    sampleConnStr: "file:data/opentrace.db?mode=rwc&_journal_mode=WAL",
  },
];

export const DB_ENGINE_MAP: Record<SupportedDbEngine, DbEngineMeta> = {
  postgres: DB_ENGINE_PRIORITIES[0],
  mssql: DB_ENGINE_PRIORITIES[1],
  mysql: DB_ENGINE_PRIORITIES[2],
  sqlite: DB_ENGINE_PRIORITIES[3],
};

/**
 * Generates RFC4122 compliant UUID v4 for database primary keys
 */
export function generateUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates standard version-agnostic DDL schema with UUID primary keys.
 * All 4 supported database engines provide the exact same 5 enterprise telemetry tables:
 * 1. traces: High-level HTTP / RPC transactions
 * 2. spans: Distributed execution waterfall steps
 * 3. queries: Database query fingerprints & IO statistics
 * 4. telemetry_logs: Correlated application log streams linked to trace ID
 * 5. annotations: Production deployment, release & incident milestone markers
 */
export function getEngineDdl(engine: SupportedDbEngine): string {
  switch (engine) {
    case "postgres":
      return `-- ===================================================================
-- OpenTrace APM Schema for PostgreSQL (Priority #1)
-- Version-Agnostic · UUID Primary Keys · Dedicated 'opentrace' Schema
-- OpenTrace Enterprise Telemetry & Distributed Observability Architecture
-- ===================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- UUID generator fallback

CREATE SCHEMA IF NOT EXISTS opentrace;

-- 1. HTTP & RPC Traces
CREATE TABLE IF NOT EXISTS opentrace.traces (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    app_name VARCHAR(64) NOT NULL DEFAULT 'MES-API',
    environment VARCHAR(32) NOT NULL DEFAULT 'production',
    route VARCHAR(256) NOT NULL,
    method VARCHAR(16) NOT NULL,
    status_code INTEGER NOT NULL,
    duration_ms DOUBLE PRECISION NOT NULL,
    sql_duration_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
    sql_count INTEGER NOT NULL DEFAULT 0,
    client_ip VARCHAR(45) DEFAULT '127.0.0.1',
    user_id VARCHAR(64) NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Distributed Spans Waterfall
CREATE TABLE IF NOT EXISTS opentrace.spans (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NOT NULL REFERENCES opentrace.traces(id) ON DELETE CASCADE,
    parent_span_id UUID NULL,
    name VARCHAR(128) NOT NULL,
    kind VARCHAR(24) NOT NULL,
    start_offset_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
    duration_ms DOUBLE PRECISION NOT NULL,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SQL Query Fingerprints & Diagnostics
CREATE TABLE IF NOT EXISTS opentrace.queries (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NOT NULL REFERENCES opentrace.traces(id) ON DELETE CASCADE,
    sql_statement TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    parameters JSONB NULL,
    duration_ms DOUBLE PRECISION NOT NULL,
    rows_affected INTEGER DEFAULT 0,
    logical_reads BIGINT DEFAULT 0,
    physical_reads BIGINT DEFAULT 0,
    is_slow BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_count INTEGER NOT NULL DEFAULT 1,
    call_site VARCHAR(256) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Correlated Telemetry Logs (OpenTrace Stream)
CREATE TABLE IF NOT EXISTS opentrace.telemetry_logs (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NULL REFERENCES opentrace.traces(id) ON DELETE SET NULL,
    service_name VARCHAR(64) NOT NULL DEFAULT 'MES-API',
    level VARCHAR(16) NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    caller VARCHAR(256) NULL,
    attributes JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Deployment & Incident Annotations (OpenTrace Timeline)
CREATE TABLE IF NOT EXISTS opentrace.annotations (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(128) NOT NULL,
    text TEXT NULL,
    tags VARCHAR(256) NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'deployment',
    epoch_ms BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimized Performance Indexes
CREATE INDEX IF NOT EXISTS idx_traces_created_at ON opentrace.traces (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traces_status_perf ON opentrace.traces (status_code, duration_ms DESC);
CREATE INDEX IF NOT EXISTS idx_spans_trace_id ON opentrace.spans (trace_id);
CREATE INDEX IF NOT EXISTS idx_queries_perf ON opentrace.queries (duration_ms DESC) WHERE is_slow = TRUE;
CREATE INDEX IF NOT EXISTS idx_logs_trace_level ON opentrace.telemetry_logs (trace_id, level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_annotations_epoch ON opentrace.annotations (epoch_ms DESC);`;

    case "mssql":
      return `-- ===================================================================
-- OpenTrace APM Schema for Microsoft SQL Server (Priority #2)
-- Version-Agnostic · UNIQUEIDENTIFIER Primary Keys · [opentrace] Schema
-- OpenTrace Enterprise Telemetry & Distributed Observability Architecture
-- ===================================================================
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'opentrace')
BEGIN
    EXEC('CREATE SCHEMA [opentrace]');
END
GO

-- 1. HTTP & RPC Traces
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Traces' AND schema_id = SCHEMA_ID('opentrace'))
BEGIN
    CREATE TABLE [opentrace].[Traces] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [AppName] NVARCHAR(64) NOT NULL DEFAULT 'MES-API',
        [Environment] NVARCHAR(32) NOT NULL DEFAULT 'production',
        [Route] NVARCHAR(256) NOT NULL,
        [Method] NVARCHAR(16) NOT NULL,
        [StatusCode] INT NOT NULL,
        [DurationMs] FLOAT NOT NULL,
        [SqlDurationMs] FLOAT NOT NULL DEFAULT 0,
        [SqlCount] INT NOT NULL DEFAULT 0,
        [ClientIp] NVARCHAR(45) NULL DEFAULT '127.0.0.1',
        [UserId] NVARCHAR(64) NULL,
        [MetadataJson] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 2. Distributed Spans Waterfall
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Spans' AND schema_id = SCHEMA_ID('opentrace'))
BEGIN
    CREATE TABLE [opentrace].[Spans] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [TraceId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [opentrace].[Traces]([Id]) ON DELETE CASCADE,
        [ParentSpanId] UNIQUEIDENTIFIER NULL,
        [Name] NVARCHAR(128) NOT NULL,
        [Kind] NVARCHAR(24) NOT NULL,
        [StartOffsetMs] FLOAT NOT NULL DEFAULT 0,
        [DurationMs] FLOAT NOT NULL,
        [AttributesJson] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 3. SQL Query Fingerprints & Diagnostics
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Queries' AND schema_id = SCHEMA_ID('opentrace'))
BEGIN
    CREATE TABLE [opentrace].[Queries] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [TraceId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [opentrace].[Traces]([Id]) ON DELETE CASCADE,
        [SqlStatement] NVARCHAR(MAX) NOT NULL,
        [Fingerprint] NVARCHAR(512) NOT NULL,
        [ParametersJson] NVARCHAR(MAX) NULL,
        [DurationMs] FLOAT NOT NULL,
        [RowsAffected] INT NULL DEFAULT 0,
        [LogicalReads] BIGINT NULL DEFAULT 0,
        [PhysicalReads] BIGINT NULL DEFAULT 0,
        [IsSlow] BIT NOT NULL DEFAULT 0,
        [DuplicateCount] INT NOT NULL DEFAULT 1,
        [CallSite] NVARCHAR(256) NULL,
        [CreatedAt] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 4. Correlated Telemetry Logs (OpenTrace Stream)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TelemetryLogs' AND schema_id = SCHEMA_ID('opentrace'))
BEGIN
    CREATE TABLE [opentrace].[TelemetryLogs] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [TraceId] UNIQUEIDENTIFIER NULL FOREIGN KEY REFERENCES [opentrace].[Traces]([Id]) ON DELETE SET NULL,
        [ServiceName] NVARCHAR(64) NOT NULL DEFAULT 'MES-API',
        [Level] NVARCHAR(16) NOT NULL DEFAULT 'INFO',
        [Message] NVARCHAR(MAX) NOT NULL,
        [Caller] NVARCHAR(256) NULL,
        [AttributesJson] NVARCHAR(MAX) NULL,
        [Timestamp] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 5. Deployment & Incident Annotations (OpenTrace Timeline)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Annotations' AND schema_id = SCHEMA_ID('opentrace'))
BEGIN
    CREATE TABLE [opentrace].[Annotations] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Title] NVARCHAR(128) NOT NULL,
        [Text] NVARCHAR(MAX) NULL,
        [Tags] NVARCHAR(256) NULL,
        [Category] NVARCHAR(32) NOT NULL DEFAULT 'deployment',
        [EpochMs] BIGINT NOT NULL,
        [CreatedAt] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- Optimized Performance Indexes
CREATE NONCLUSTERED INDEX [IX_Traces_CreatedAt] ON [opentrace].[Traces] ([CreatedAt] DESC);
CREATE NONCLUSTERED INDEX [IX_Traces_StatusCode_Duration] ON [opentrace].[Traces] ([StatusCode], [DurationMs] DESC);
CREATE NONCLUSTERED INDEX [IX_Spans_TraceId] ON [opentrace].[Spans] ([TraceId]);
CREATE NONCLUSTERED INDEX [IX_Queries_TraceId] ON [opentrace].[Queries] ([TraceId]);
CREATE NONCLUSTERED INDEX [IX_Logs_TraceId_Time] ON [opentrace].[TelemetryLogs] ([TraceId], [Timestamp] DESC);
CREATE NONCLUSTERED INDEX [IX_Annotations_Epoch] ON [opentrace].[Annotations] ([EpochMs] DESC);`;

    case "mysql":
      return `-- ===================================================================
-- OpenTrace APM Schema for MySQL (Priority #3)
-- Version-Agnostic · CHAR(36) UUID Primary Keys · InnoDB UTF8MB4
-- OpenTrace Enterprise Telemetry & Distributed Observability Architecture
-- ===================================================================

-- 1. HTTP & RPC Traces
CREATE TABLE IF NOT EXISTS \`opentrace_traces\` (
    \`id\` CHAR(36) NOT NULL PRIMARY KEY,
    \`app_name\` VARCHAR(64) NOT NULL DEFAULT 'MES-API',
    \`environment\` VARCHAR(32) NOT NULL DEFAULT 'production',
    \`route\` VARCHAR(256) NOT NULL,
    \`method\` VARCHAR(16) NOT NULL,
    \`status_code\` INT NOT NULL,
    \`duration_ms\` DOUBLE NOT NULL,
    \`sql_duration_ms\` DOUBLE NOT NULL DEFAULT 0,
    \`sql_count\` INT NOT NULL DEFAULT 0,
    \`client_ip\` VARCHAR(45) DEFAULT '127.0.0.1',
    \`user_id\` VARCHAR(64) NULL,
    \`metadata\` JSON NULL,
    \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX \`idx_traces_created_at\` (\`created_at\` DESC),
    INDEX \`idx_traces_status_perf\` (\`status_code\`, \`duration_ms\` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Distributed Spans Waterfall
CREATE TABLE IF NOT EXISTS \`opentrace_spans\` (
    \`id\` CHAR(36) NOT NULL PRIMARY KEY,
    \`trace_id\` CHAR(36) NOT NULL,
    \`parent_span_id\` CHAR(36) NULL,
    \`name\` VARCHAR(128) NOT NULL,
    \`kind\` VARCHAR(24) NOT NULL,
    \`start_offset_ms\` DOUBLE NOT NULL DEFAULT 0,
    \`duration_ms\` DOUBLE NOT NULL,
    \`attributes\` JSON NULL,
    \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX \`idx_spans_trace\` (\`trace_id\`),
    CONSTRAINT \`fk_spans_trace\` FOREIGN KEY (\`trace_id\`) REFERENCES \`opentrace_traces\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SQL Query Fingerprints & Diagnostics
CREATE TABLE IF NOT EXISTS \`opentrace_queries\` (
    \`id\` CHAR(36) NOT NULL PRIMARY KEY,
    \`trace_id\` CHAR(36) NOT NULL,
    \`sql_statement\` MEDIUMTEXT NOT NULL,
    \`fingerprint\` VARCHAR(512) NOT NULL,
    \`parameters\` JSON NULL,
    \`duration_ms\` DOUBLE NOT NULL,
    \`rows_affected\` INT DEFAULT 0,
    \`logical_reads\` BIGINT DEFAULT 0,
    \`physical_reads\` BIGINT DEFAULT 0,
    \`is_slow\` TINYINT(1) NOT NULL DEFAULT 0,
    \`duplicate_count\` INT NOT NULL DEFAULT 1,
    \`call_site\` VARCHAR(256) NULL,
    \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX \`idx_queries_trace\` (\`trace_id\`),
    INDEX \`idx_queries_slow\` (\`duration_ms\` DESC),
    CONSTRAINT \`fk_queries_trace\` FOREIGN KEY (\`trace_id\`) REFERENCES \`opentrace_traces\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Correlated Telemetry Logs (OpenTrace Stream)
CREATE TABLE IF NOT EXISTS \`opentrace_telemetry_logs\` (
    \`id\` CHAR(36) NOT NULL PRIMARY KEY,
    \`trace_id\` CHAR(36) NULL,
    \`service_name\` VARCHAR(64) NOT NULL DEFAULT 'MES-API',
    \`level\` VARCHAR(16) NOT NULL DEFAULT 'INFO',
    \`message\` MEDIUMTEXT NOT NULL,
    \`caller\` VARCHAR(256) NULL,
    \`attributes\` JSON NULL,
    \`timestamp\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX \`idx_logs_trace_level\` (\`trace_id\`, \`level\`, \`timestamp\` DESC),
    CONSTRAINT \`fk_logs_trace\` FOREIGN KEY (\`trace_id\`) REFERENCES \`opentrace_traces\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Deployment & Incident Annotations (OpenTrace Timeline)
CREATE TABLE IF NOT EXISTS \`opentrace_annotations\` (
    \`id\` CHAR(36) NOT NULL PRIMARY KEY,
    \`title\` VARCHAR(128) NOT NULL,
    \`text\` TEXT NULL,
    \`tags\` VARCHAR(256) NULL,
    \`category\` VARCHAR(32) NOT NULL DEFAULT 'deployment',
    \`epoch_ms\` BIGINT NOT NULL,
    \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX \`idx_annotations_epoch\` (\`epoch_ms\` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    case "sqlite":
      return `-- ===================================================================
-- OpenTrace APM Schema for SQLite (Priority #4)
-- Version-Agnostic · TEXT UUID Primary Keys · High-Performance WAL
-- OpenTrace Enterprise Telemetry & Distributed Observability Architecture
-- ===================================================================
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- 1. HTTP & RPC Traces
CREATE TABLE IF NOT EXISTS opentrace_traces (
    id TEXT NOT NULL PRIMARY KEY,
    app_name TEXT NOT NULL DEFAULT 'MES-API',
    environment TEXT NOT NULL DEFAULT 'production',
    route TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    duration_ms REAL NOT NULL,
    sql_duration_ms REAL NOT NULL DEFAULT 0,
    sql_count INTEGER NOT NULL DEFAULT 0,
    client_ip TEXT DEFAULT '127.0.0.1',
    user_id TEXT NULL,
    metadata TEXT DEFAULT '{}',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Distributed Spans Waterfall
CREATE TABLE IF NOT EXISTS opentrace_spans (
    id TEXT NOT NULL PRIMARY KEY,
    trace_id TEXT NOT NULL,
    parent_span_id TEXT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    start_offset_ms REAL NOT NULL DEFAULT 0,
    duration_ms REAL NOT NULL,
    attributes TEXT DEFAULT '{}',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trace_id) REFERENCES opentrace_traces (id) ON DELETE CASCADE
);

-- 3. SQL Query Fingerprints & Diagnostics
CREATE TABLE IF NOT EXISTS opentrace_queries (
    id TEXT NOT NULL PRIMARY KEY,
    trace_id TEXT NOT NULL,
    sql_statement TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    parameters TEXT NULL,
    duration_ms REAL NOT NULL,
    rows_affected INTEGER DEFAULT 0,
    logical_reads INTEGER DEFAULT 0,
    physical_reads INTEGER DEFAULT 0,
    is_slow INTEGER NOT NULL DEFAULT 0,
    duplicate_count INTEGER NOT NULL DEFAULT 1,
    call_site TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trace_id) REFERENCES opentrace_traces (id) ON DELETE CASCADE
);

-- 4. Correlated Telemetry Logs (OpenTrace Stream)
CREATE TABLE IF NOT EXISTS opentrace_telemetry_logs (
    id TEXT NOT NULL PRIMARY KEY,
    trace_id TEXT NULL,
    service_name TEXT NOT NULL DEFAULT 'MES-API',
    level TEXT NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    caller TEXT NULL,
    attributes TEXT DEFAULT '{}',
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trace_id) REFERENCES opentrace_traces (id) ON DELETE SET NULL
);

-- 5. Deployment & Incident Annotations (OpenTrace Timeline)
CREATE TABLE IF NOT EXISTS opentrace_annotations (
    id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    text TEXT NULL,
    tags TEXT NULL,
    category TEXT NOT NULL DEFAULT 'deployment',
    epoch_ms INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Optimized Performance Indexes
CREATE INDEX IF NOT EXISTS idx_traces_created ON opentrace_traces (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traces_perf ON opentrace_traces (status_code, duration_ms DESC);
CREATE INDEX IF NOT EXISTS idx_spans_trace ON opentrace_spans (trace_id);
CREATE INDEX IF NOT EXISTS idx_queries_trace ON opentrace_queries (trace_id);
CREATE INDEX IF NOT EXISTS idx_logs_trace ON opentrace_telemetry_logs (trace_id, level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_annotations_epoch ON opentrace_annotations (epoch_ms DESC);`;
  }
}

/**
 * Safely inlines JSON parameters into SQL query string for instant copy & paste.
 * Supports $1, $2 (PgSQL), @param (MSSQL), ? / :param (MySQL / SQLite).
 */
export function inlineSqlParameters(
  sql: string,
  paramsJson: any,
  engine: SupportedDbEngine = "postgres"
): string {
  if (!sql) return "";
  if (!paramsJson) return sql;
  try {
    const params = typeof paramsJson === "string" ? JSON.parse(paramsJson) : paramsJson;
    let inlined = sql;

    const formatVal = (val: any) => {
      if (val === null || val === undefined) return "NULL";
      if (typeof val === "number") return String(val);
      if (typeof val === "boolean") {
        return engine === "mssql" || engine === "mysql"
          ? val
            ? "1"
            : "0"
          : val
            ? "TRUE"
            : "FALSE";
      }
      return `'${String(val).replace(/'/g, "''")}'`;
    };

    if (Array.isArray(params)) {
      // Positional parameter replacement ($1, $2 for PgSQL, or ? for MySQL/SQLite)
      params.forEach((val, idx) => {
        const valStr = formatVal(val);
        // Check PgSQL $1, $2
        const pgRegex = new RegExp(`\\$${idx + 1}\\b`, "g");
        if (pgRegex.test(inlined)) {
          inlined = inlined.replace(pgRegex, valStr);
        } else {
          // Replace first unescaped question mark
          inlined = inlined.replace(/\?/, valStr);
        }
      });
      return inlined;
    }

    const keys = Object.keys(params).sort((a, b) => b.length - a.length);
    for (const rawKey of keys) {
      const valStr = formatVal(params[rawKey]);
      // Handle both @Key, :Key, and bare Key
      const keyName = rawKey.startsWith("@") || rawKey.startsWith(":") ? rawKey : `@${rawKey}`;
      const colonKey = rawKey.startsWith(":") ? rawKey : `:${rawKey}`;

      const regex1 = new RegExp(`(?<=[^a-zA-Z0-9_@]|^)${keyName}(?=[^a-zA-Z0-9_]|$)`, "gi");
      const regex2 = new RegExp(`(?<=[^a-zA-Z0-9_:]|^)${colonKey}(?=[^a-zA-Z0-9_]|$)`, "gi");

      inlined = inlined.replace(regex1, valStr).replace(regex2, valStr);
    }
    return inlined;
  } catch {
    return sql;
  }
}

/**
 * Wraps SQL with dialect-appropriate performance diagnostics / execution plan
 */
export function wrapWithStatistics(sql: string, engine: SupportedDbEngine = "postgres"): string {
  if (!sql) return "";
  const trimmed = sql.trim();

  switch (engine) {
    case "postgres":
      return `EXPLAIN (ANALYZE, BUFFERS, COSTS, VERBOSE, FORMAT TEXT)
${trimmed};`;

    case "mssql":
      return `SET STATISTICS IO ON;
SET STATISTICS TIME ON;

${trimmed}

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;`;

    case "mysql":
      return `EXPLAIN ANALYZE
${trimmed};`;

    case "sqlite":
      return `EXPLAIN QUERY PLAN
${trimmed};`;
  }
}

/**
 * Case-insensitive lookup helper for data rows
 */
export function getRowValue(row: any, colName: string): any {
  if (!row || colName === null || colName === undefined) return undefined;
  if (row[colName] !== undefined) return row[colName];

  const lower = String(colName).toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.toLowerCase() === lower) {
      return row[key];
    }
  }
  return undefined;
}

/**
 * Uppercases SQL keywords while preserving column and table names
 */
export function uppercaseSqlKeywords(sql: string): string {
  if (!sql) return "";
  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "AND",
    "OR",
    "NOT",
    "INSERT",
    "INTO",
    "UPDATE",
    "SET",
    "DELETE",
    "JOIN",
    "INNER JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "CROSS JOIN",
    "ON",
    "GROUP BY",
    "ORDER BY",
    "ASC",
    "DESC",
    "HAVING",
    "TOP",
    "DISTINCT",
    "AS",
    "WITH",
    "NOLOCK",
    "UNION",
    "ALL",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    "IS",
    "NULL",
    "LIKE",
    "IN",
    "EXISTS",
    "BETWEEN",
    "COUNT",
    "SUM",
    "AVG",
    "MIN",
    "MAX",
  ];
  let result = sql;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    result = result.replace(regex, keyword);
  });
  return result;
}

export interface MockExecutionResult {
  rowCount: number;
  elapsedMs: number;
  columns: string[];
  rows: Record<string, any>[];
  inlinedSql: string;
  stats: {
    totalLogicalReads: number;
    totalScanCount: number;
    cpuTimeMs: number;
    elapsedTimeMs: number;
    tables: {
      tableName: string;
      scanCount: number;
      logicalReads: number;
      physicalReads: number;
    }[];
    rawMessages: string[];
  };
}

/**
 * Executes a simulated query against mock MES / ERP / API schemas.
 * Injects UUID-based IDs for authentic security.
 */
export function executeMockQuery(
  sql: string,
  paramsJson: any,
  engine: SupportedDbEngine = "postgres"
): MockExecutionResult {
  const inlined = inlineSqlParameters(sql, paramsJson, engine);
  const lower = sql.toLowerCase();

  if (
    lower.includes("ssfmf") ||
    lower.includes("@mo") ||
    lower.includes("partnumber") ||
    lower.includes("get-mo-info")
  ) {
    return {
      rowCount: 1,
      elapsedMs: 3.17,
      columns: ["id", "Mo", "PartNumber", "ModelName", "PlanQty", "Status"],
      rows: [
        {
          id: generateUuid(),
          Mo: "VI2-26012115",
          PartNumber: "5816C4283000",
          ModelName: "ECW219L(INT)_VN SMT (5816C4283000)",
          PlanQty: 2200,
          Status: 2,
        },
      ],
      inlinedSql: inlined,
      stats: {
        totalLogicalReads: 7,
        totalScanCount: 1,
        cpuTimeMs: 1.0,
        elapsedTimeMs: 3.17,
        tables: [
          { tableName: "SSFMF", scanCount: 1, logicalReads: 7, physicalReads: 0 },
          { tableName: "INVMB", scanCount: 1, logicalReads: 3, physicalReads: 0 },
        ],
        rawMessages: [
          "Table 'SSFMF'. Scan count 1, logical reads 7, physical reads 0.",
          "Table 'INVMB'. Scan count 1, logical reads 3, physical reads 0.",
          "SQL Server Execution Times: CPU time = 1 ms, elapsed time = 3.17 ms.",
        ],
      },
    };
  }

  if (lower.includes("order_items")) {
    return {
      rowCount: 3,
      elapsedMs: 4.1,
      columns: ["id", "order_id", "sku", "quantity", "unit_price", "discount"],
      rows: [
        {
          id: generateUuid(),
          order_id: 842,
          sku: "ECW219L-01",
          quantity: 10,
          unit_price: 89.0,
          discount: 0.0,
        },
        {
          id: generateUuid(),
          order_id: 842,
          sku: "CBL-ETH-CAT6",
          quantity: 20,
          unit_price: 4.5,
          discount: 0.5,
        },
        {
          id: generateUuid(),
          order_id: 842,
          sku: "PWR-ADP-12V",
          quantity: 10,
          unit_price: 15.0,
          discount: 0.0,
        },
      ],
      inlinedSql: inlined,
      stats: {
        totalLogicalReads: 12,
        totalScanCount: 1,
        cpuTimeMs: 1.5,
        elapsedTimeMs: 4.1,
        tables: [{ tableName: "order_items", scanCount: 1, logicalReads: 12, physicalReads: 0 }],
        rawMessages: [
          "Table 'order_items'. Scan count 1, logical reads 12, physical reads 0.",
          "SQL Server Execution Times: CPU time = 1.5 ms, elapsed time = 4.1 ms.",
        ],
      },
    };
  }

  if (lower.includes("customers")) {
    return {
      rowCount: 1,
      elapsedMs: 2.2,
      columns: ["id", "company_name", "contact_email", "tier", "country"],
      rows: [
        {
          id: generateUuid(),
          company_name: "Global Enterprise Logistics",
          contact_email: "orders@example.com",
          tier: "Tier-1 Partner",
          country: "VN",
        },
      ],
      inlinedSql: inlined,
      stats: {
        totalLogicalReads: 4,
        totalScanCount: 1,
        cpuTimeMs: 0.8,
        elapsedTimeMs: 2.2,
        tables: [{ tableName: "customers", scanCount: 1, logicalReads: 4, physicalReads: 0 }],
        rawMessages: [
          "Table 'customers'. Scan count 1, logical reads 4, physical reads 0.",
          "SQL Server Execution Times: CPU time = 0.8 ms, elapsed time = 2.2 ms.",
        ],
      },
    };
  }

  if (lower.includes("inventory")) {
    return {
      rowCount: 1,
      elapsedMs: 6.8,
      columns: ["id", "sku", "warehouse", "quantity", "reserved", "available", "last_counted"],
      rows: [
        {
          id: generateUuid(),
          sku: "ECW219L-01",
          warehouse: "VN-WH01",
          quantity: 2200,
          reserved: 350,
          available: 1850,
          last_counted: "2026-11-21 08:00:00",
        },
      ],
      inlinedSql: inlined,
      stats: {
        totalLogicalReads: 24,
        totalScanCount: 1,
        cpuTimeMs: 2.0,
        elapsedTimeMs: 6.8,
        tables: [{ tableName: "inventory", scanCount: 1, logicalReads: 24, physicalReads: 0 }],
        rawMessages: [
          "Table 'inventory'. Scan count 1, logical reads 24, physical reads 0.",
          "SQL Server Execution Times: CPU time = 2 ms, elapsed time = 6.8 ms.",
        ],
      },
    };
  }

  if (lower.includes("ssfdc") || lower.includes("mfgcode")) {
    return {
      rowCount: 3,
      elapsedMs: 12.4,
      columns: ["id", "MfgCode", "MfgTypeName", "Factory", "ActiveLines", "YieldRate"],
      rows: [
        {
          id: generateUuid(),
          MfgCode: "MFG-001",
          MfgTypeName: "Surface Mount Technology (SMT)",
          Factory: "VN-FAC1",
          ActiveLines: 12,
          YieldRate: "99.4%",
        },
        {
          id: generateUuid(),
          MfgCode: "MFG-002",
          MfgTypeName: "Dual In-line Package (DIP)",
          Factory: "VN-FAC1",
          ActiveLines: 9,
          YieldRate: "98.9%",
        },
        {
          id: generateUuid(),
          MfgCode: "MFG-003",
          MfgTypeName: "System Integration & Packing",
          Factory: "VN-FAC2",
          ActiveLines: 8,
          YieldRate: "99.8%",
        },
      ],
      inlinedSql: inlined,
      stats: {
        totalLogicalReads: 48,
        totalScanCount: 1,
        cpuTimeMs: 3.5,
        elapsedTimeMs: 12.4,
        tables: [{ tableName: "SSFDC", scanCount: 1, logicalReads: 48, physicalReads: 0 }],
        rawMessages: [
          "Table 'SSFDC'. Scan count 1, logical reads 48, physical reads 0.",
          "SQL Server Execution Times: CPU time = 3.5 ms, elapsed time = 12.4 ms.",
        ],
      },
    };
  }

  // Fallback for orders or any general query
  return {
    rowCount: 1,
    elapsedMs: 5.4,
    columns: ["id", "customer_id", "status", "total_cents", "factory", "created_at"],
    rows: [
      {
        id: generateUuid(),
        customer_id: 51,
        status: "completed",
        total_cents: 12900,
        factory: "VN",
        created_at: "2026-11-21 16:30:00",
      },
    ],
    inlinedSql: inlined,
    stats: {
      totalLogicalReads: 18,
      totalScanCount: 1,
      cpuTimeMs: 1.8,
      elapsedTimeMs: 5.4,
      tables: [{ tableName: "orders", scanCount: 1, logicalReads: 18, physicalReads: 0 }],
      rawMessages: [
        "Table 'orders'. Scan count 1, logical reads 18, physical reads 0.",
        "SQL Server Execution Times: CPU time = 1.8 ms, elapsed time = 5.4 ms.",
      ],
    },
  };
}
