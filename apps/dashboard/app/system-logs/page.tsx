"use client";

import React, { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class SystemLogsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("SystemLogs uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#111217] text-slate-200 px-4">
          <div className="flex flex-col items-center max-w-md text-center gap-4 p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">APM System Trace Explorer</h2>
              <p className="text-xs text-slate-400 mt-1">
                {this.state.error?.message || "Đang kết nối tới APM logs stream..."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs cursor-pointer border-zinc-700 hover:bg-zinc-800"
                onClick={() => this.setState({ hasError: false })}
              >
                <RefreshCw className="size-3.5 mr-1.5" /> Thử lại
              </Button>
              <Button
                size="sm"
                className="text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => {
                  window.location.href = "/telemetry";
                }}
              >
                Về SpurTrace Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const SystemLogsPage = dynamic(
  () => import("@/features/system-logs/SystemLogsPage").then((mod) => mod.SystemLogsPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#111217] text-sm text-slate-400">
        Loading APM Explorer...
      </div>
    ),
  }
);

export default function Page() {
  return (
    <SystemLogsErrorBoundary>
      <SystemLogsPage />
    </SystemLogsErrorBoundary>
  );
}
