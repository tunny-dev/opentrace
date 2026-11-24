CREATE TABLE IF NOT EXISTS sys_traces (
  trace_id VARCHAR(64) NOT NULL,
  app_name TEXT NOT NULL,
  method VARCHAR(12) NOT NULL,
  route TEXT NOT NULL,
  status_code SMALLINT NOT NULL,
  duration_ms DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  sample_reason VARCHAR(12) NOT NULL,
  exception_json JSONB,
  spans_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  sql_calls_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  breadcrumbs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (trace_id, created_at)
) PARTITION BY RANGE (created_at);

-- Keep only dashboard filters indexed; indexes are inherited by new partitions.
CREATE INDEX IF NOT EXISTS idx_sys_traces_app_created
  ON sys_traces (app_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_traces_status_created
  ON sys_traces (status_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_traces_duration
  ON sys_traces (duration_ms DESC);

-- Provision today and the next 13 daily partitions. Run this from a scheduled
-- maintenance job before traffic reaches a new day.
DO $$
DECLARE
  day_offset INTEGER;
  partition_start TIMESTAMPTZ;
  partition_end TIMESTAMPTZ;
  partition_name TEXT;
BEGIN
  FOR day_offset IN 0..13 LOOP
    partition_start := date_trunc('day', now()) + day_offset * INTERVAL '1 day';
    partition_end := partition_start + INTERVAL '1 day';
    partition_name := 'sys_traces_' || to_char(partition_start, 'YYYYMMDD');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF sys_traces FOR VALUES FROM (%L) TO (%L)',
      partition_name, partition_start, partition_end
    );
  END LOOP;
END $$;

-- Retention: detach/drop old daily partitions in a scheduled maintenance job.
-- Avoid DELETE FROM sys_traces for large windows; identify children in
-- pg_inherits, then ALTER TABLE sys_traces DETACH PARTITION <child> CONCURRENTLY
-- (PostgreSQL 14+) followed by DROP TABLE <child> after the detach completes.
