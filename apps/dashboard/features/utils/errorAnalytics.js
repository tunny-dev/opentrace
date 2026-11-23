/**
 * Normalizes an error message or exception string into a grouping fingerprint.
 * Removes dynamic UUIDs, timestamps, line numbers, and hex memory addresses.
 */
export function getErrorFingerprint(rawMessage = '', exceptionType = '') {
  if (!rawMessage && !exceptionType) return 'UnknownError';

  let normalized = (rawMessage || '')
    .replace(/TraceId=[0-9a-fA-F]{16,32}/gi, 'TraceId=<traceId>')
    .replace(/\b[0-9a-fA-F]{32}\b/g, '<traceId>')
    .replace(
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
      '<guid>'
    )
    .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g, '<timestamp>')
    .replace(/(?:responded \d+ in|in|executed in)\s+[\d.]+\s*ms/gi, 'in <duration>')
    .replace(/0x[0-9a-fA-F]+/g, '<hex>')
    .replace(/line \d+/gi, 'line <line>')
    .replace(/partNumber=[^&\s]+/gi, 'partNumber=<pn>')
    .replace(/Mo=[^&\s]+/gi, 'Mo=<mo>')
    .replace(/\b\d{5,}\b/g, '<id>')
    .trim()
    .slice(0, 150);

  return `${exceptionType || 'Error'}:${normalized}`;
}

/**
 * Parses exception text or message to extract the primary exception type
 * (e.g., SqlException, NullReferenceException, TimeoutException, HttpRequestException)
 */
export function parseExceptionType(message = '', exceptionStr = '') {
  const combined = `${exceptionStr} ${message}`;
  const match = combined.match(/\b([A-Z][a-zA-Z0-9_]*(?:Exception|Error|Fault))\b/);
  if (match) return match[1];
  if (combined.includes('Timeout')) return 'TimeoutException';
  if (combined.includes('Deadlock')) return 'SqlDeadlockException';
  if (combined.includes('401') || combined.includes('Unauthorized')) return 'UnauthorizedException';
  if (combined.includes('403') || combined.includes('Forbidden')) return 'ForbiddenException';
  if (combined.includes('404') || combined.includes('NotFound')) return 'NotFoundException';
  if (combined.includes('500') || combined.includes('InternalServerError'))
    return 'InternalServerError';
  return 'ApplicationError';
}

/**
 * Aggregates all traces and error events into grouped issues
 */
export function aggregateErrors(traces = []) {
  if (!Array.isArray(traces) || traces.length === 0) {
    return {
      issues: [],
      metrics: {
        totalErrorsCount: 0,
        distinctIssuesCount: 0,
        criticalIssuesCount: 0,
        affectedRoutesCount: 0,
      },
    };
  }

  const issueMap = new Map();
  let totalErrorsCount = 0;
  const affectedRoutesSet = new Set();

  traces.forEach((trace) => {
    const isErr = trace.statusCode >= 400 || trace.hasError;
    const events = Array.isArray(trace.events) ? trace.events : [];
    const errorEvents = events.filter((e) => e.eventType === 'error' || e.exception);

    // If trace itself is error status or has error events
    if (isErr || errorEvents.length > 0) {
      if (trace.path) affectedRoutesSet.add(trace.path);

      // If we have specific error events, group each
      if (errorEvents.length > 0) {
        errorEvents.forEach((evt) => {
          totalErrorsCount += 1;
          const exType = parseExceptionType(evt.message, evt.exception);
          const rawMsg = evt.message || evt.exception || `HTTP ${trace.statusCode} Error`;
          const fp = getErrorFingerprint(rawMsg, exType);

          if (!issueMap.has(fp)) {
            issueMap.set(fp, {
              id: fp,
              title: rawMsg
                .split('\n')[0]
                .replace(/^.*Exception:\s*/i, '')
                .replace(/\s*TraceId=[0-9a-fA-F]{16,32}/gi, '')
                .trim()
                .slice(0, 120),
              errorType: exType,
              rawMessage: rawMsg,
              exceptionStack: evt.exception || '',
              occurrences: 0,
              impactedRoutes: new Set(),
              traceIds: new Set(),
              firstSeen: evt.time || trace.timestamp,
              lastSeen: evt.time || trace.timestamp,
              sampleTrace: trace,
              statusCode: trace.statusCode || 500,
            });
          }

          const issue = issueMap.get(fp);
          issue.occurrences += 1;
          if (trace.path) issue.impactedRoutes.add(trace.path);
          if (trace.traceId) issue.traceIds.add(trace.traceId);
          if (evt.exception && !issue.exceptionStack) issue.exceptionStack = evt.exception;
          if (evt.time && evt.time > issue.lastSeen) issue.lastSeen = evt.time;
          if (evt.time && evt.time < issue.firstSeen) issue.firstSeen = evt.time;
        });
      } else {
        // Trace had 4xx/5xx status without explicit event
        totalErrorsCount += 1;
        const exType = trace.statusCode >= 500 ? 'ServerHttpError' : 'ClientHttpError';
        const rawMsg = `HTTP ${trace.statusCode} on ${trace.method} ${trace.path}`;
        const fp = getErrorFingerprint(rawMsg, exType);

        if (!issueMap.has(fp)) {
          issueMap.set(fp, {
            id: fp,
            title: rawMsg,
            errorType: exType,
            rawMessage: rawMsg,
            exceptionStack: '',
            occurrences: 0,
            impactedRoutes: new Set(),
            traceIds: new Set(),
            firstSeen: trace.timestamp,
            lastSeen: trace.timestamp,
            sampleTrace: trace,
            statusCode: trace.statusCode,
          });
        }

        const issue = issueMap.get(fp);
        issue.occurrences += 1;
        if (trace.path) issue.impactedRoutes.add(trace.path);
        if (trace.traceId) issue.traceIds.add(trace.traceId);
        if (trace.timestamp > issue.lastSeen) issue.lastSeen = trace.timestamp;
      }
    }
  });

  const issues = Array.from(issueMap.values()).map((issue) => {
    const isCritical =
      issue.statusCode >= 500 || issue.occurrences >= 5 || issue.errorType.includes('Sql');
    return {
      ...issue,
      impactedRoutes: Array.from(issue.impactedRoutes),
      traceIds: Array.from(issue.traceIds),
      isCritical,
    };
  });

  // Sort issues by occurrences desc
  issues.sort((a, b) => b.occurrences - a.occurrences);

  const criticalIssuesCount = issues.filter((i) => i.isCritical).length;

  return {
    issues,
    metrics: {
      totalErrorsCount,
      distinctIssuesCount: issues.length,
      criticalIssuesCount,
      affectedRoutesCount: affectedRoutesSet.size,
    },
  };
}
