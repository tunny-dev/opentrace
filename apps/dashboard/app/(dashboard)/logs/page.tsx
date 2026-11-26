"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LogsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/system-logs");
  }, [router]);

  return (
    <div className="flex h-96 w-full flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
      <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
      <span>Đang chuyển hướng tới Nhật ký Hệ thống (/system-logs)...</span>
    </div>
  );
}
