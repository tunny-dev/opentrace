"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useRef, useContext } from "react";
import { demoTraces, type DemoEnvironment, type DemoService, type DemoTrace } from "./demo-data";
import { demoLogs, type DemoLog } from "./demo-logs";
import type { UserRole } from "@/components/spurtrace/user-profile-menu";
import { useAuthStore } from "./auth-store";

interface TelemetryContextType {
  traces: DemoTrace[];
  filteredTraces: DemoTrace[];
  logs: DemoLog[];
  filteredLogs: DemoLog[];
  selectedTrace: DemoTrace | null;
  setSelectedTrace: (trace: DemoTrace | null) => void;
  openTrace: (trace: DemoTrace) => void;
  closeTrace: () => void;
  openTraceFromLog: (traceId: string) => void;
  environment: DemoEnvironment;
  setEnvironment: (env: DemoEnvironment) => void;
  service: DemoService | "all";
  setService: (srv: DemoService | "all") => void;
  liveStream: boolean;
  toggleLiveStream: () => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  refreshDashboard: () => void;
  refreshing: boolean;
  isAuthenticated: boolean;
  login: (role: UserRole, user: string) => void;
  signOut: () => void;
}

const TelemetryContext = React.createContext<TelemetryContextType | null>(null);

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error("useTelemetry must be used within TelemetryProvider");
  return ctx;
}

function buildLiveTrace(
  sequence: number,
  environment: DemoEnvironment,
  service: DemoService | "all"
): DemoTrace {
  const matching = demoTraces.filter((trace) => service === "all" || trace.service === service);
  const template = matching[sequence % matching.length] ?? demoTraces[sequence % demoTraces.length];
  const timestamp = new Date();
  const failed = sequence % 9 === 0;
  const duration = Math.round(24 + Math.random() * 240);
  const route = template.route;

  return {
    ...template,
    id: `tr_live_${timestamp.getTime().toString(36)}`,
    createdAt: timestamp.toISOString(),
    ageLabel: "now",
    environment,
    service: service === "all" ? template.service : service,
    isLive: true,
    duration,
    status: failed ? 500 : 200,
    state: failed ? "error" : "success",
    sqlCount: template.queries.length,
    exception: failed
      ? {
          name: "LiveSampleError",
          message: "Simulated intermittent dependency failure",
          signature: "livesampleerror: simulated intermittent dependency failure",
        }
      : undefined,
    spans: template.spans.map((span, index) => ({
      ...span,
      duration:
        index === 0 ? duration : Math.min(duration, Math.max(2, Math.round(duration * 0.36))),
    })),
    queries: template.queries.map((query) => ({
      ...query,
      slow: false,
      slowCount: 0,
      duplicateCount: 1,
    })),
    route,
  };
}

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthStore();
  const [traces, setTraces] = useState<DemoTrace[]>(demoTraces);
  const [selectedTrace, setSelectedTrace] = useState<DemoTrace | null>(null);
  const [environment, setEnvironment] = useState<DemoEnvironment>("production");
  const [service, setService] = useState<DemoService | "all">("all");
  const [liveStream, setLiveStream] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isAuthenticated = auth.isAuthenticated;
  const userRole = auth.user.role;
  const setUserRole = (role: UserRole) => auth.setRole(role);
  const login = (role: UserRole, email: string) => auth.login(email, role);
  const signOut = () => auth.logout();

  const traceRef = useRef<DemoTrace[]>(demoTraces);
  const liveSequence = useRef(0);

  useEffect(() => {
    traceRef.current = traces;
  }, [traces]);

  useEffect(() => {
    if (!liveStream) return;
    const interval = window.setInterval(() => {
      liveSequence.current += 1;
      const nextTrace = buildLiveTrace(liveSequence.current, environment, service);
      setTraces((current) => [nextTrace, ...current].slice(0, 100));
    }, 4000);
    return () => window.clearInterval(interval);
  }, [liveStream, environment, service]);

  const filteredTraces = useMemo(() => {
    return traces.filter(
      (trace) =>
        trace.environment === environment && (service === "all" || trace.service === service)
    );
  }, [traces, environment, service]);

  const filteredLogs = useMemo(() => {
    return demoLogs.filter(
      (log) => log.environment === environment && (service === "all" || log.service === service)
    );
  }, [environment, service]);

  function openTrace(trace: DemoTrace) {
    setSelectedTrace(trace);
  }

  function closeTrace() {
    setSelectedTrace(null);
  }

  function openTraceFromLog(traceId: string) {
    const trace = traceRef.current.find((item) => item.id === traceId);
    if (trace) openTrace(trace);
  }

  function toggleLiveStream() {
    setLiveStream((v) => !v);
  }

  function refreshDashboard() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }

  return (
    <TelemetryContext.Provider
      value={{
        traces,
        filteredTraces,
        logs: demoLogs,
        filteredLogs,
        selectedTrace,
        setSelectedTrace,
        openTrace,
        closeTrace,
        openTraceFromLog,
        environment,
        setEnvironment,
        service,
        setService,
        liveStream,
        toggleLiveStream,
        userRole,
        setUserRole,
        refreshDashboard,
        refreshing,
        isAuthenticated,
        login,
        signOut,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}
