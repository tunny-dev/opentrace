"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MonitorSmartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "opentrace-small-screen-ack";
const SMALL_SCREEN_QUERY = "(max-width: 767.98px)";

function getSessionFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setSessionFlag(key: string): void {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Ignore storage failures (private mode / restricted storage).
  }
}

export function SmallScreenWarning() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const alreadyAcknowledged = getSessionFlag(STORAGE_KEY);
    setAcknowledged(alreadyAcknowledged);
    if (alreadyAcknowledged) return;

    const mediaQuery = window.matchMedia(SMALL_SCREEN_QUERY);
    const sync = () => {
      if (getSessionFlag(STORAGE_KEY)) return;
      setOpen(mediaQuery.matches);
    };

    sync();

    // Keep in sync with both media-query changes and explicit resizes.
    const onChange = (event: MediaQueryListEvent) => {
      if (getSessionFlag(STORAGE_KEY)) return;
      setOpen(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }

    // Safari < 14 fallback
    mediaQuery.addListener(onChange);
    window.addEventListener("resize", sync);
    return () => {
      mediaQuery.removeListener(onChange);
      window.removeEventListener("resize", sync);
    };
  }, []);

  const handleContinue = () => {
    setSessionFlag(STORAGE_KEY);
    setAcknowledged(true);
    setFallbackMessage(null);
    setOpen(false);
  };

  const handleGoBack = () => {
    // Best-effort history navigation. If there is no meaningful previous page,
    // keep the user in place and show a clear fallback.
    const hasReferrer = document.referrer.length > 0;
    const hasHistory = window.history.length > 1;

    if (hasReferrer || hasHistory) {
      router.back();
      return;
    }

    setFallbackMessage("No previous page is available. You can continue on this screen if needed.");
  };

  if (acknowledged) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleContinue();
        }
      }}
    >
      <DialogContent showCloseButton={true} className="max-w-md gap-0 overflow-hidden p-0">
        <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <DialogHeader className="gap-4 sm:flex-row sm:items-start sm:gap-4">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
              aria-hidden="true"
            >
              <MonitorSmartphone className="size-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <DialogTitle className="text-base font-semibold text-foreground">
                Small Screen Detected
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                OpenTrace is optimized for wide dashboards, telemetry charts, and trace waterfalls.
                You can continue exploring on this device.
              </DialogDescription>
            </div>
          </DialogHeader>

          {fallbackMessage ? (
            <p
              role="status"
              className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-400"
            >
              {fallbackMessage}
            </p>
          ) : null}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 px-5 py-4 sm:px-6 sm:py-5">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full sm:w-auto font-medium"
            onClick={handleGoBack}
          >
            Go Back
          </Button>
          <Button
            type="button"
            className="h-10 w-full sm:flex-1 bg-emerald-600 font-medium text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/30 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400 cursor-pointer"
            onClick={handleContinue}
          >
            Continue to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
