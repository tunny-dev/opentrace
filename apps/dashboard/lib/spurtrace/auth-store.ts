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
  id: "usr_alex_kim",
  name: "Alex Kim",
  email: "alex.kim@spurtrace.dev",
  avatar: "AK",
  role: "Admin",
  lastLogin: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: defaultUser,
      token: null,

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
