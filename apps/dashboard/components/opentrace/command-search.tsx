"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bell,
  Boxes,
  Database,
  FileText,
  Gauge,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  TerminalSquare,
  Zap,
  Globe,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n/i18n-context";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useTelemetry } from "@/lib/opentrace/telemetry-context";

export function CommandSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { toggleLiveStream, setUserRole } = useTelemetry();
  const { dict, locale, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : true;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  function handleNavigate(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={dict.header.searchPlaceholder} />
      <CommandList className="max-h-87.5">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading={dict.common.overview}>
          <CommandItem onSelect={() => handleNavigate("/")}>
            <Gauge className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{dict.common.overview}</span>
            <CommandShortcut>G O</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/traces")}>
            <Activity className="mr-2 h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span>{dict.common.traces}</span>
            <CommandShortcut>G T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/errors")}>
            <AlertTriangle className="mr-2 h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>{dict.common.errors}</span>
            <CommandShortcut>G E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/sql")}>
            <Database className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>{dict.common.sql}</span>
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/alerts")}>
            <Bell className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>{dict.common.alerts}</span>
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/logs")}>
            <FileText className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>{dict.common.logs}</span>
            <CommandShortcut>G L</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/services")}>
            <Boxes className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{dict.common.services}</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/releases")}>
            <ShieldCheck className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>{dict.common.releases}</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/settings")}>
            <TerminalSquare className="mr-2 h-4 w-4 text-zinc-400" />
            <span>{dict.common.settings}</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={dict.common.actions}>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              setLocale("vi");
            }}
          >
            <Globe className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Ngôn ngữ: Tiếng Việt (Vietnamese)</span>
            {locale === "vi" && <CommandShortcut>✓</CommandShortcut>}
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              setLocale("en");
            }}
          >
            <Globe className="mr-2 h-4 w-4 text-sky-500" />
            <span>Language: English</span>
            {locale === "en" && <CommandShortcut>✓</CommandShortcut>}
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              toggleLiveStream();
            }}
          >
            <Zap className="mr-2 h-4 w-4 text-amber-400" />
            <span>{dict.common.liveStream}</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              setTheme(isDark ? "light" : "dark");
            }}
          >
            {isDark ? (
              <Sun className="mr-2 h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="mr-2 h-4 w-4 text-sky-400" />
            )}
            <span>{isDark ? dict.header.switchToLight : dict.header.switchToDark}</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              setUserRole("Admin");
            }}
          >
            <ShieldCheck className="mr-2 h-4 w-4 text-emerald-400" />
            <span>{dict.common.admin}</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              setUserRole("Viewer");
            }}
          >
            <AlertTriangle className="mr-2 h-4 w-4 text-sky-400" />
            <span>{dict.common.viewer}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
