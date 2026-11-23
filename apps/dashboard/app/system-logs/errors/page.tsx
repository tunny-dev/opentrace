"use client";

import dynamic from "next/dynamic";

const ErrorTrackingPage = dynamic(
  () => import("@/features/system-logs/ErrorTrackingPage").then((mod) => mod.ErrorTrackingPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#111217] text-sm text-slate-400">
        Loading Error Tracking...
      </div>
    ),
  }
);

export default function Page() {
  return <ErrorTrackingPage />;
}
