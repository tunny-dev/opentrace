"use client";

import { useRouter } from "next/navigation";
import { LoginPage } from "@/components/spurtrace/login-page";
import type { UserRole } from "@/components/spurtrace/user-profile-menu";
import { useAuthStore } from "@/lib/spurtrace/auth-store";

export default function LoginRoute() {
  const router = useRouter();
  const authLogin = useAuthStore((state) => state.login);

  function handleLogin(role: UserRole, user: string) {
    authLogin(user, role);
    if (typeof window !== "undefined") {
      const isTelemetry = window.location.pathname.startsWith("/telemetry");
      const target = isTelemetry ? "/telemetry/system-logs" : "/system-logs";
      window.location.href = target;
    } else {
      router.push("/system-logs");
    }
  }

  return <LoginPage onLogin={handleLogin} />;
}
