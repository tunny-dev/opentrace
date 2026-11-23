"use client";

import { useState, useEffect } from "react";
import { Check, Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function LanguageToggle({
  className,
  variant = "dropdown",
}: {
  className?: string;
  variant?: "dropdown" | "simple";
}) {
  const { locale, setLocale, toggleLocale, dict } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`flex h-8 items-center gap-1.5 rounded-lg border border-(--ot-border) bg-(--ot-panel-raised) px-2 text-xs text-(--ot-muted) ${className ?? ""}`}
      >
        <Languages className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase">VI</span>
      </div>
    );
  }

  const tooltipLabel = locale === "vi" ? dict.header.switchToEn : dict.header.switchToVi;

  if (variant === "simple") {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              type="button"
              aria-label={tooltipLabel}
              onClick={toggleLocale}
              className={`group flex h-8 items-center gap-1.5 rounded-lg border border-(--ot-border) bg-(--ot-panel-raised) px-2 text-xs text-(--ot-muted) shadow-xs transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:border-emerald-500/35 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-400 cursor-pointer ${className ?? ""}`}
            >
              <Languages className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[11px] font-bold tracking-wider">
                {locale === "vi" ? "VI" : "EN"}
              </span>
            </Button>
          }
        />
        <TooltipContent side="bottom" align="end">
          {tooltipLabel}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              aria-label={dict.header.languageToggle}
              className={`group flex h-8 items-center gap-1.5 rounded-lg border border-(--ot-border) bg-(--ot-panel-raised) px-2.5 text-xs text-(--ot-muted) shadow-xs transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:border-emerald-500/35 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-400 outline-none cursor-pointer ${className ?? ""}`}
            >
              <Globe className="h-3.5 w-3.5 text-emerald-500 transition-transform duration-300 group-hover:rotate-45" />
              <span className="text-[11px] font-bold tracking-wide text-(--ot-text)">
                {locale === "vi" ? "VI" : "EN"}
              </span>
            </DropdownMenuTrigger>
          }
        />
        <TooltipContent side="bottom" align="end">
          {dict.header.languageToggle}: {locale === "vi" ? "Tiếng Việt" : "English"}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-40 bg-(--ot-panel) border-(--ot-border) p-1 text-(--ot-text) shadow-xl"
      >
        <DropdownMenuItem
          onClick={() => setLocale("vi")}
          className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
            locale === "vi"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-(--ot-text) hover:bg-(--ot-border-soft)"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm leading-none">🇻🇳</span>
            <span>Tiếng Việt</span>
          </div>
          {locale === "vi" && <Check className="h-3.5 w-3.5 text-emerald-500" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setLocale("en")}
          className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
            locale === "en"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-(--ot-text) hover:bg-(--ot-border-soft)"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm leading-none">🇬🇧</span>
            <span>English</span>
          </div>
          {locale === "en" && <Check className="h-3.5 w-3.5 text-emerald-500" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
