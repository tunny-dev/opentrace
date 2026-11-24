"use client";

import PropTypes from 'prop-types';
import { SqlStudioModal as CanonicalSqlStudioModal } from '@/components/spurtrace/sql-studio-modal';

export function SqlStudioModal({
  isOpen,
  onClose,
  initialIndex = 0,
  initialQueryIndex,
  sqlEvents = [],
  trace = {},
  traceId,
  endpoint,
  traceLatency,
  queries,
  role = 'Admin',
}) {
  if (!isOpen) return null;

  // Build queries list
  let resolvedQueries = queries || [];
  if ((!resolvedQueries || resolvedQueries.length === 0) && Array.isArray(sqlEvents) && sqlEvents.length > 0) {
    resolvedQueries = sqlEvents.map((evt, idx) => {
      let params = evt.paramsJson ?? evt.parameters ?? {};
      if (typeof params === 'string') {
        try {
          params = JSON.parse(params);
        } catch {
          params = { raw: params };
        }
      }
      return {
        id: evt.id || `q_${idx}`,
        sql: evt.sql || evt.query || evt.rawSql || '',
        paramsJson: params,
        durationMs: Number(evt.durationMs ?? evt.duration ?? 0),
        name: evt.name || evt.fingerprint || `Query #${idx + 1}`,
      };
    });
  }

  const resolvedTraceId = String(trace?.traceId || trace?.id || traceId || 'spurtrace-sql');
  const resolvedEndpoint = String(
    (trace?.method || trace?.path || trace?.route)
      ? `${trace.method || 'SQL'} ${trace.path || trace.route || ''}`.trim()
      : (endpoint || 'T-SQL Execution Sandbox')
  );
  const resolvedLatency = String(
    trace?.totalDurationMs != null
      ? `${Math.round(trace.totalDurationMs)} ms`
      : (traceLatency || `${resolvedQueries[0]?.durationMs || 0} ms`)
  );
  const resolvedIndex = initialIndex ?? initialQueryIndex ?? 0;

  return (
    <CanonicalSqlStudioModal
      isOpen={isOpen}
      onClose={onClose}
      traceId={resolvedTraceId}
      endpoint={resolvedEndpoint}
      traceLatency={resolvedLatency}
      queries={resolvedQueries}
      initialQueryIndex={resolvedIndex}
      role={role}
    />
  );
}

SqlStudioModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialIndex: PropTypes.number,
  initialQueryIndex: PropTypes.number,
  sqlEvents: PropTypes.array,
  trace: PropTypes.object,
  traceId: PropTypes.string,
  endpoint: PropTypes.string,
  traceLatency: PropTypes.string,
  queries: PropTypes.array,
  role: PropTypes.string,
};

export default SqlStudioModal;
