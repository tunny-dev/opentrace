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
    router.push("/");
  }

  return <LoginPage onLogin={handleLogin} />;
}
