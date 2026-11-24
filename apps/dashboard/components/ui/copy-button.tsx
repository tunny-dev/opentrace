"use client";

import * as React from "react";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, type buttonVariants } from "@/components/ui/button";
import { copyToClipboard } from "@/components/ui/data-table-utils";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export interface CopyButtonProps extends React.ComponentProps<typeof Button> {
  value: string;
  label?: string;
  successMessage?: string;
  showToast?: boolean;
}

export function CopyButton({
  value,
  label,
  successMessage,
  showToast = true,
  className,
  variant = "ghost",
  size = "xs",
  children,
  onClick,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: any) {
    e.stopPropagation?.();
    if (!value) return;

    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      if (showToast) {
        toast.success(successMessage || `Đã sao chép: "${value.length > 32 ? value.slice(0, 32) + "…" : value}"`);
      }
      setTimeout(() => setCopied(false), 2000);
    } else {
      if (showToast) {
        toast.error("Không thể sao chép vào bộ nhớ tạm.");
      }
    }

    if (onClick) {
      onClick(e);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        "cursor-pointer inline-flex items-center gap-1.5 transition-colors select-none",
        copied
          ? "text-emerald-600 dark:text-emerald-400 font-medium"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      title={copied ? "Đã sao chép!" : label || "Sao chép vào clipboard"}
      aria-label={copied ? "Đã sao chép!" : label || "Sao chép vào clipboard"}
      {...props}
    >
      {copied ? (
        <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-150" />
      ) : (
        <Copy className="size-3.5 shrink-0 transition-transform group-hover:scale-105" />
      )}
      {children || (label ? <span>{copied ? "Đã sao chép!" : label}</span> : null)}
    </Button>
  );
}
