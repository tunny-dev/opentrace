/*
  SQL Server partitioned flat schema. Run the partition function/scheme once,
  then create one boundary per day in the maintenance job before that date.
*/
DECLARE @today DATE = CONVERT(date, SYSUTCDATETIME());
DECLARE @boundaries NVARCHAR(MAX) = N'';
DECLARE @offset INT = -14;
WHILE @offset <= 30
BEGIN
  SET @boundaries += CASE WHEN @boundaries = N'' THEN N'' ELSE N',' END
    + N'''' + CONVERT(nvarchar(10), DATEADD(day, @offset, @today), 23) + N'T00:00:00''';
  SET @offset += 1;
END;

IF NOT EXISTS (SELECT 1 FROM sys.partition_functions WHERE name = N'pf_sys_traces_created_at')
  EXEC(N'CREATE PARTITION FUNCTION pf_sys_traces_created_at (datetime2(3)) AS RANGE RIGHT FOR VALUES (' + @boundaries + N')');

IF NOT EXISTS (SELECT 1 FROM sys.partition_schemes WHERE name = N'ps_sys_traces_created_at')
  EXEC(N'CREATE PARTITION SCHEME ps_sys_traces_created_at AS PARTITION pf_sys_traces_created_at ALL TO ([PRIMARY])');

IF OBJECT_ID(N'dbo.sys_traces', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.sys_traces (
    created_at datetime2(3) NOT NULL,
    trace_id nvarchar(64) NOT NULL,
    app_name nvarchar(160) NOT NULL,
    method varchar(12) NOT NULL,
    route nvarchar(1024) NOT NULL,
    status_code smallint NOT NULL,
    duration_ms float NOT NULL,
    sample_reason varchar(12) NOT NULL,
    exception_json nvarchar(max) NULL,
    spans_json nvarchar(max) NOT NULL CONSTRAINT df_sys_traces_spans DEFAULT N'[]',
    sql_calls_json nvarchar(max) NOT NULL CONSTRAINT df_sys_traces_sql DEFAULT N'[]',
    breadcrumbs_json nvarchar(max) NOT NULL CONSTRAINT df_sys_traces_breadcrumbs DEFAULT N'[]',
    CONSTRAINT pk_sys_traces PRIMARY KEY CLUSTERED (created_at, trace_id),
    CONSTRAINT ck_sys_traces_spans_json CHECK (ISJSON(spans_json) = 1),
    CONSTRAINT ck_sys_traces_sql_json CHECK (ISJSON(sql_calls_json) = 1),
    CONSTRAINT ck_sys_traces_breadcrumbs_json CHECK (ISJSON(breadcrumbs_json) = 1)
  ) ON ps_sys_traces_created_at(created_at);

  CREATE INDEX idx_sys_traces_app_created
    ON dbo.sys_traces (app_name, created_at DESC) ON ps_sys_traces_created_at(created_at);
  CREATE INDEX idx_sys_traces_status_created
    ON dbo.sys_traces (status_code, created_at DESC) ON ps_sys_traces_created_at(created_at);
  -- created_at is included to keep this index aligned with the partition scheme.
  CREATE INDEX idx_sys_traces_duration
    ON dbo.sys_traces (duration_ms DESC, created_at) ON ps_sys_traces_created_at(created_at);
END;

/*
  Retention: switch an expired partition into an empty staging table, truncate
  or drop it, then merge its boundary with ALTER PARTITION FUNCTION. Keep the
  staging table's schema/indexes aligned; do not issue a large DELETE.
*/
