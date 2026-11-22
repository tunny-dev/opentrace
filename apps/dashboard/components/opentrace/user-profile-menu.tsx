"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LogOut, Settings2, ShieldCheck, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UserRole = "Admin" | "Viewer";

export function UserProfileMenu({
  role,
  onRoleChange,
  onSignOut,
  onOpenSettings,
}: {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSignOut?: () => void;
  onOpenSettings?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function handleOpenSettings() {
    setMenuOpen(false);
    if (onOpenSettings) {
      onOpenSettings();
    }
  }

  function handleSignOut() {
    setMenuOpen(false);
    if (onSignOut) {
      onSignOut();
    }
  }

  return (
    <div className="user-profile-menu" ref={rootRef}>
      <Button
        className="user-row h-auto w-full p-0 font-normal justify-start bg-transparent hover:bg-transparent"
        variant="ghost"
        type="button"
        aria-label={`User profile, Alex Kim, ${role}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls="user-profile-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="user-avatar">AK</span>
        <span className="user-copy">
          <strong>Alex Kim</strong>
          <span>alex.kim@opentrace.dev</span>
        </span>
        <span className={`profile-role-pill role-${role.toLowerCase()}`}>{role}</span>
        <ChevronDown className="profile-chevron" aria-hidden="true" />
      </Button>

      {menuOpen && (
        <div
          className="user-menu-popover"
          id="user-profile-menu"
          role="menu"
          aria-label="User profile menu"
        >
          <div className="profile-menu-user" role="none">
            <div className="profile-menu-avatar">AK</div>
            <div>
              <strong>Alex Kim</strong>
              <span>alex.kim@opentrace.dev</span>
            </div>
          </div>
          <div className="profile-menu-section-label">ROLE SWITCHING</div>
          <Button
            className="profile-menu-item role-choice h-auto w-full justify-start text-left font-normal bg-transparent"
            variant="ghost"
            type="button"
            role="menuitemradio"
            aria-checked={role === "Admin"}
            onClick={() => {
              onRoleChange("Admin");
              setMenuOpen(false);
            }}
          >
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>Admin</strong>
              <small>Full SQL, keys & system settings</small>
            </span>
            {role === "Admin" && <Check className="role-check" aria-hidden="true" />}
          </Button>
          <Button
            className="profile-menu-item role-choice h-auto w-full justify-start text-left font-normal bg-transparent"
            variant="ghost"
            type="button"
            role="menuitemradio"
            aria-checked={role === "Viewer"}
            onClick={() => {
              onRoleChange("Viewer");
              setMenuOpen(false);
            }}
          >
            <UserRound aria-hidden="true" />
            <span>
              <strong>Viewer</strong>
              <small>Sensitive SQL values are masked</small>
            </span>
            {role === "Viewer" && <Check className="role-check" aria-hidden="true" />}
          </Button>
          <div className="profile-menu-divider" />
          <Button
            className="profile-menu-item h-auto w-full justify-start text-left font-normal bg-transparent"
            variant="ghost"
            type="button"
            role="menuitem"
            onClick={handleOpenSettings}
          >
            <Settings2 aria-hidden="true" />
            <span>Workspace Settings</span>
          </Button>
          <Button
            className="profile-menu-item profile-signout h-auto w-full justify-start text-left font-normal bg-transparent"
            variant="ghost"
            type="button"
            role="menuitem"
            onClick={handleSignOut}
          >
            <LogOut aria-hidden="true" />
            <span>Sign Out</span>
          </Button>
          <div className="profile-menu-footnote">Live RBAC demonstration</div>
        </div>
      )}
    </div>
  );
}
