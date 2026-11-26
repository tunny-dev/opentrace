import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "@/components/spurtrace/user-profile-menu";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  lastLogin: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile;
  token: string | null;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const defaultUser: UserProfile = {
  id: "usr_admin",
  name: "Administrator",
  email: "admin@senao.com",
  avatar: "AD",
  role: "Admin",
  lastLogin: new Date().toISOString(),
};

function getInitialAuth(): { isAuthenticated: boolean; user: UserProfile; token: string | null } {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: defaultUser, token: null };
  }
  try {
    const raw = localStorage.getItem("opentrace_auth_session");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.isAuthenticated) {
        return {
          isAuthenticated: true,
          user: parsed.state.user || defaultUser,
          token: parsed.state.token || null,
        };
      }
    }
  } catch {}
  return { isAuthenticated: false, user: defaultUser, token: null };
}

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: initialAuth.isAuthenticated,
      user: initialAuth.user,
      token: initialAuth.token,

      login: (email: string, role: UserRole = "Admin") => {
        set({
          isAuthenticated: true,
          user: {
            ...defaultUser,
            email: email || defaultUser.email,
            role,
            lastLogin: new Date().toISOString(),
          },
          token: `ot_session_${Date.now()}`,
        });
        return true;
      },

      logout: () => {
        set({
          isAuthenticated: false,
          token: null,
        });
        if (typeof window !== "undefined") {
          fetch("/api/telemetry/auth/logout", { method: "POST" }).catch(() => {});
        }
      },

      setRole: (role: UserRole) => {
        set((state) => ({
          user: {
            ...state.user,
            role,
          },
        }));
      },
    }),
    {
      name: "opentrace_auth_session",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);
