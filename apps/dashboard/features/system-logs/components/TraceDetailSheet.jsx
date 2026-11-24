"use client";

import PropTypes from 'prop-types';
import { TraceDetailPanel } from '@/components/spurtrace/trace-detail-panel';
import { toDemoTrace } from '@/lib/spurtrace/trace-adapter';

export function TraceDetailSheet({ trace, isOpen, onClose }) {
  if (!isOpen || !trace) return null;

  const demoTrace = toDemoTrace(trace);
  return <TraceDetailPanel trace={demoTrace} onClose={onClose} />;
}

TraceDetailSheet.propTypes = {
  trace: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TraceDetailSheet;
