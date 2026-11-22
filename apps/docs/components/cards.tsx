"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Zap,
  Layers,
  Database,
  Globe,
  Laptop,
  Server,
  Shield,
  Code2,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  layers: Layers,
  database: Database,
  globe: Globe,
  laptop: Laptop,
  server: Server,
  shield: Shield,
  code: Code2,
};

export function Cards({
  children,
  cols = 2,
}: {
  children: React.ReactNode;
  cols?: 2 | 3;
}) {
  return (
    <div
      className={`my-6 grid gap-4 ${
        cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
      }`}
    >
      {children}
    </div>
  );
}

export function Card({
  title,
  description,
  href,
  icon: iconProp,
  iconName,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconName?: string;
  badge?: string;
}) {
  const Icon = (iconName ? ICON_MAP[iconName] : null) || iconProp;

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 group-hover:border-emerald-500/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {Icon ? <Icon className="size-4.5" /> : <ArrowUpRight className="size-4" />}
          </div>
          {badge && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {badge}
            </span>
          )}
        </div>
        <h3 className="mt-3.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Read guide</span>
        <ArrowUpRight className="size-3" />
      </div>
    </Link>
  );
}
