"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useRef, useContext, useCallback } from "react";
import type { DemoEnvironment, DemoService, DemoTrace } from "./demo-data";
import type { DemoLog } from "./demo-logs";
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
  service: DemoService | string | "all";
  setService: (srv: DemoService | string | "all") => void;
  availableServices: string[];
  appName: string;
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

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthStore();
  const [traces, setTraces] = useState<DemoTrace[]>([]);
  const [logs, setLogs] = useState<DemoLog[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<DemoTrace | null>(null);
  const [environment, setEnvironment] = useState<DemoEnvironment>("production");
  const [service, setService] = useState<DemoService | string | "all">("all");
  const [appName, setAppName] = useState<string>("Senao EMS");
  const [liveStream, setLiveStream] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const isAuthenticated = auth.isAuthenticated;
  const userRole = auth.user.role;
  const setUserRole = (role: UserRole) => auth.setRole(role);
  const login = (role: UserRole, email: string) => auth.login(email, role);
  const signOut = () => auth.logout();

  const traceRef = useRef<DemoTrace[]>([]);
  useEffect(() => {
    traceRef.current = traces;
  }, [traces]);

  // Fetch real traces from /api/traces
  const fetchRealTraces = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const res = await fetch("/api/traces?limit=500", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.traces) && data.traces.length > 0) {
        setTraces(data.traces);
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.warn("Could not fetch live traces, keeping current dataset:", err);
    } finally {
      if (!isBackground) setRefreshing(false);
      setInitialLoaded(true);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRealTraces();
    fetch("/api/telemetry/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.app_name) setAppName(d.app_name);
      })
      .catch(() => {});
  }, [fetchRealTraces]);

  // Live polling for real new traces when liveStream is enabled
  useEffect(() => {
    if (!liveStream) return;
    const interval = window.setInterval(() => {
      fetchRealTraces(true);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [liveStream, fetchRealTraces]);

  // Extract distinct services from loaded traces
  const availableServices = useMemo(() => {
    const set = new Set<string>();
    traces.forEach((t) => {
      if (t.service) set.add(t.service);
    });
    return Array.from(set);
  }, [traces]);

  const filteredTraces = useMemo(() => {
    return traces.filter((trace) => {
      const matchEnv = environment === "production" || trace.environment === environment;
      const matchService = service === "all" || trace.service === service;
      return matchEnv && matchService;
    });
  }, [traces, environment, service]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchEnv = environment === "production" || log.environment === environment;
      const matchService = service === "all" || log.service === service;
      return matchEnv && matchService;
    });
  }, [logs, environment, service]);

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
    fetchRealTraces();
  }

  return (
    <TelemetryContext.Provider
      value={{
        traces,
        filteredTraces,
        logs,
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
        availableServices,
        appName,
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
