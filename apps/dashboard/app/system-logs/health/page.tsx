"use client";

import dynamic from "next/dynamic";

const SystemHealthPage = dynamic(
  () => import("@/features/system-logs/SystemHealthPage").then((mod) => mod.SystemHealthPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#111217] text-sm text-slate-400">
        Loading System Health...
      </div>
    ),
  }
);

export default function Page() {
  return <SystemHealthPage />;
}
