"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Database,
  FileText,
  Gauge,
  Home,
  LifeBuoy,
  RotateCcw,
  Search,
  Settings2,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { ThemeToggle } from "@/components/spurtrace/theme-toggle";
import { LanguageToggle } from "@/components/spurtrace/language-toggle";

export default function NotFound() {
  const [currentPath, setCurrentPath] = React.useState<string>("");
  const [timestamp, setTimestamp] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname + window.location.search);
      setTimestamp(new Date().toLocaleString("vi-VN"));
    }
  }, []);

  const quickLinks = [
    { href: "/", label: "Tổng quan APM", desc: "Chỉ số latency P50/P95/P99 & lưu lượng", icon: Gauge },
    { href: "/traces", label: "Theo dõi Yêu cầu (Traces)", desc: "Waterfall spans & chẩn đoán chi tiết", icon: Activity },
    { href: "/errors", label: "Lỗi Ngoại lệ", desc: "Theo dõi lỗi 5xx và Exception stack traces", icon: AlertTriangle },
    { href: "/logs", label: "Nhật ký Luồng", desc: "Log stream terminal thời gian thực", icon: FileText },
    { href: "/settings", label: "Cài đặt Cấu hình", desc: "Ngưỡng cảnh báo, kết nối DB & sao lưu", icon: Settings2 },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-(--ot-bg) text-(--ot-text) selection:bg-emerald-500/30 selection:text-emerald-400">
      {/* Ambient background glow orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 size-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-40 size-[480px] rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-[120px]"
      />
      {/* Radial grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(100,116,139,0.12)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]"
      />

      {/* Top Header Navbar */}
      <header className="relative z-10 flex h-14 w-full shrink-0 items-center justify-between border-b border-(--ot-border) bg-(--ot-panel)/80 px-4 sm:px-8 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-102">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <Activity className="size-4.5" />
          </div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-sm font-bold tracking-tight text-foreground">SpurTrace</span>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              APM 404
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Hero 404 Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 text-center max-w-4xl mx-auto w-full">
        {/* Animated Sonar / Radar Signal Icon */}
        <div className="relative mb-6">
          <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-b from-rose-500/15 to-amber-500/10 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <AlertTriangle className="size-10 sm:size-12 text-rose-500 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex size-3.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex size-3.5 rounded-full bg-rose-500" />
          </span>
        </div>

        {/* 404 Title Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-mono font-semibold text-rose-500 mb-3">
          <span>ERROR 404</span>
          <span>•</span>
          <span>ROUTE_OR_TRACE_NOT_FOUND</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Không tìm thấy trang hoặc Vết Trace đã hết hạn
        </h1>

        <p className="mt-3.5 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          Đường dẫn bạn yêu cầu không tồn tại trên hệ thống giám sát SpurTrace APM, hoặc dữ liệu vết đo lường đã được tự động dọn dẹp theo chính sách lưu trữ (Retention Policy).
        </p>

        {/* Diagnostic Path Card with 1-Click Copy */}
        {currentPath && (
          <div className="mt-6 flex items-center gap-2.5 max-w-xl w-full rounded-xl border border-(--ot-border) bg-(--ot-panel)/90 px-4 py-2.5 text-left shadow-xs backdrop-blur-md">
            <Terminal className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider font-mono">
                Requested URL Target
              </span>
              <span className="block truncate font-mono text-xs text-foreground font-medium">
                {currentPath}
              </span>
            </div>
            <CopyButton
              value={typeof window !== "undefined" ? window.location.href : currentPath}
              label="Sao chép URL"
              successMessage="Đã sao chép đường dẫn bị 404 vào clipboard!"
              variant="outline"
              size="sm"
              className="shrink-0 text-xs h-7"
            />
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            render={<Link href="/" />}
            size="default"
            className="h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 !text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Home className="size-4" />
            <span>Về SpurTrace Dashboard</span>
          </Button>

          <Button
            render={<Link href="/traces" />}
            variant="outline"
            size="default"
            className="h-10 px-4 rounded-lg border-(--ot-border) bg-(--ot-panel) hover:bg-(--ot-panel-raised) text-xs font-medium text-foreground transition-all cursor-pointer flex items-center gap-2"
          >
            <Activity className="size-4 text-emerald-500" />
            <span>Xem Danh sách Traces</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
            className="h-10 px-4 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại trang trước</span>
          </Button>
        </div>

        {/* Quick Module Directory */}
        <div className="mt-12 w-full pt-8 border-t border-(--ot-border)">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Hoặc truy cập trực tiếp các phân hệ giám sát
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-left">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col justify-between p-3.5 rounded-xl border border-(--ot-border) bg-(--ot-panel)/60 hover:bg-(--ot-panel-raised) hover:border-emerald-500/40 transition-all shadow-2xs hover:shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="size-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                    {item.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-(--ot-border) bg-(--ot-panel)/50 px-6 py-3.5 text-xs text-muted-foreground text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SpurTrace In-App APM Observability Engine</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          {timestamp && <span>Thời điểm kiểm tra: {timestamp}</span>}
          <span>v2.14.0-enterprise</span>
        </div>
      </footer>
    </div>
  );
}
