"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SqlPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/traces");
  }, [router]);

  return (
    <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground font-sans">
      Đang chuyển tiếp về Theo dõi Yêu cầu (Traces)...
    </div>
  );
}
