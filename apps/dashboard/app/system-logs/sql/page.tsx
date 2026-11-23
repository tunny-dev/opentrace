"use client";

import dynamic from "next/dynamic";

const SqlAnalyticsPage = dynamic(
  () => import("@/features/system-logs/SqlAnalyticsPage").then((mod) => mod.SqlAnalyticsPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#111217] text-sm text-slate-400">
        Loading SQL Performance Hub...
      </div>
    ),
  }
);

export default function Page() {
  return <SqlAnalyticsPage />;
}
