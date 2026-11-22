"use client";

import { useRouter } from "next/navigation";
import { LoginPage } from "@/components/opentrace/login-page";
import type { UserRole } from "@/components/opentrace/user-profile-menu";
import { useAuthStore } from "@/lib/opentrace/auth-store";

export default function LoginRoute() {
  const router = useRouter();
  const authLogin = useAuthStore((state) => state.login);

  function handleLogin(role: UserRole, user: string) {
    authLogin(user, role);
    router.push("/");
  }

  return <LoginPage onLogin={handleLogin} />;
}
