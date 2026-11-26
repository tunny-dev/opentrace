"use client";

import dynamic from "next/dynamic";

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

export function TabClient() {
  return <SystemLogsPage />;
}
