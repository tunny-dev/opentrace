"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { TableOfContents, type TocItem } from "./toc";
import { PreviousNextNavigation } from "./prev-next";
import { ChevronRight, Calendar, Sparkles } from "lucide-react";
import { docsNavItems } from "@/lib/docs-data";

interface DocsLayoutProps {
  slugKey: string;
  title: string;
  description: string;
  group: string;
  lastUpdated?: string;
  badge?: string;
  toc: TocItem[];
  children: React.ReactNode;
}

export function DocsLayout({
  slugKey,
  title,
  description,
  group,
  lastUpdated,
  badge,
  toc,
  children,
}: DocsLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Compute Previous and Next pages
  const allPages = React.useMemo(() => {
    return docsNavItems.flatMap((g) => g.items);
  }, []);

  const currentIndex = allPages.findIndex((p) => p.href.includes(slugKey));
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage = currentIndex >= 0 && currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <Header
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        mobileSidebarOpen={mobileSidebarOpen}
      />

      {/* Mobile Sidebar Slide-over */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 top-14 z-40 bg-background/95 backdrop-blur-md md:hidden overflow-y-auto">
          <Sidebar mobile onCloseMobile={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-start">
        {/* Left Column: Sidebar (Desktop) */}
        <div className="sticky top-14 hidden md:block shrink-0">
          <Sidebar />
        </div>

        {/* Center Column: Article Content */}
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12">
          <article className="mx-auto max-w-3xl">
            {/* Breadcrumbs */}
            <div className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500">
              <Link href="/docs/getting-started/introduction" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Docs
              </Link>
              <ChevronRight className="size-3 text-zinc-400" />
              <span>{group}</span>
              <ChevronRight className="size-3 text-zinc-400" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{title}</span>
            </div>

            {/* Page Header */}
            <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-6">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                  {title}
                </h1>
                {badge && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {description}
              </p>

              {lastUpdated && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-400 pt-1">
                  <Calendar className="size-3" />
                  <span>Last updated: {lastUpdated}</span>
                </div>
              )}
            </div>

            {/* Page Body */}
            <div className="pt-6">
              {children}
            </div>

            {/* Previous / Next Navigation */}
            <PreviousNextNavigation prev={prevPage} next={nextPage} />
          </article>
        </main>

        {/* Right Column: Table of Contents (Desktop) */}
        <div className="sticky top-14 hidden xl:block w-60 shrink-0 px-4 py-8">
          <TableOfContents items={toc} />
        </div>
      </div>
    </div>
  );
}
