"use client";

import * as React from "react";
import { Info, Lightbulb, AlertTriangle, AlertOctagon } from "lucide-react";

type CalloutType = "note" | "tip" | "warning" | "danger";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const config = {
  note: {
    icon: Info,
    border: "border-blue-500/30",
    bg: "bg-blue-500/5 dark:bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    title: "Note",
  },
  tip: {
    icon: Lightbulb,
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    title: "Tip",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/30",
    bg: "bg-amber-500/5 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    title: "Warning",
  },
  danger: {
    icon: AlertOctagon,
    border: "border-red-500/30",
    bg: "bg-red-500/5 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-300",
    title: "Caution",
  },
};

export function Callout({ type = "note", title, children }: CalloutProps) {
  const c = config[type];
  const Icon = c.icon;

  return (
    <div className={`my-4 flex gap-3.5 rounded-xl border p-4 text-xs leading-relaxed ${c.border} ${c.bg}`}>
      <Icon className={`size-4.5 shrink-0 mt-0.5 ${c.text}`} />
      <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
        <div className={`font-semibold ${c.text}`}>{title || c.title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
