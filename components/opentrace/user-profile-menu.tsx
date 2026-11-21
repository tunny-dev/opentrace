"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, LogOut, Settings2, ShieldCheck, UserRound, X } from "lucide-react"

export type UserRole = "Admin" | "Viewer"

export function UserProfileMenu({ role, onRoleChange }: { role: UserRole; onRoleChange: (role: UserRole) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!settingsOpen && !loginOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false)
        setLoginOpen(false)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [settingsOpen, loginOpen])

  function openSettings() {
    setMenuOpen(false)
    setSettingsOpen(true)
  }

  function signOut() {
    setMenuOpen(false)
    setLoginOpen(true)
  }

  return (
    <>
      <div className="user-profile-menu" ref={rootRef}>
        <button className="user-row" type="button" aria-label={`User profile, Alex Kim, ${role}`} aria-haspopup="menu" aria-expanded={menuOpen} aria-controls="user-profile-menu" onClick={() => setMenuOpen((open) => !open)}>
          <span className="user-avatar">AK</span>
          <span className="user-copy"><strong>Alex Kim</strong><span>alex.kim@opentrace.dev</span></span>
          <span className={`profile-role-pill role-${role.toLowerCase()}`}>{role}</span>
          <ChevronDown className="profile-chevron" aria-hidden="true" />
        </button>
        {menuOpen && <div className="user-menu-popover" id="user-profile-menu" role="menu" aria-label="User profile menu">
          <div className="profile-menu-user" role="none"><div className="profile-menu-avatar">AK</div><div><strong>Alex Kim</strong><span>alex.kim@opentrace.dev</span></div></div>
          <div className="profile-menu-section-label">ROLE SIMULATION</div>
          <button className="profile-menu-item role-choice" type="button" role="menuitemradio" aria-checked={role === "Admin"} onClick={() => { onRoleChange("Admin"); setMenuOpen(false) }}>
            <ShieldCheck aria-hidden="true" /><span><strong>Admin</strong><small>Full SQL and workspace access</small></span>{role === "Admin" && <Check className="role-check" aria-hidden="true" />}
          </button>
          <button className="profile-menu-item role-choice" type="button" role="menuitemradio" aria-checked={role === "Viewer"} onClick={() => { onRoleChange("Viewer"); setMenuOpen(false) }}>
            <UserRound aria-hidden="true" /><span><strong>Viewer</strong><small>Sensitive SQL values are masked</small></span>{role === "Viewer" && <Check className="role-check" aria-hidden="true" />}
          </button>
          <div className="profile-menu-divider" />
          <button className="profile-menu-item" type="button" role="menuitem" onClick={openSettings}><Settings2 aria-hidden="true" /><span>Settings</span></button>
          <button className="profile-menu-item profile-signout" type="button" role="menuitem" onClick={signOut}><LogOut aria-hidden="true" /><span>Sign Out</span></button>
          <div className="profile-menu-footnote">Role simulation · not production authentication</div>
        </div>}
      </div>

      {settingsOpen && <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSettingsOpen(false)}>
        <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title">
          <header><div><span className="section-kicker">WORKSPACE</span><h2 id="profile-settings-title">Settings</h2></div><button className="icon-button" type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><X /></button></header>
          <div className="profile-settings-row"><div><strong>Signed-in profile</strong><span>Alex Kim · alex.kim@opentrace.dev</span></div><span className={`profile-role-pill role-${role.toLowerCase()}`}>{role}</span></div>
          <div className="profile-settings-notice"><ShieldCheck aria-hidden="true" /><span>Role switching is local demo state. Connect a real auth provider before using this for access control.</span></div>
          <button className="profile-modal-close" type="button" onClick={() => setSettingsOpen(false)}>Done</button>
        </section>
      </div>}

      {loginOpen && <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setLoginOpen(false)}>
        <section className="profile-modal login-preview-modal" role="dialog" aria-modal="true" aria-labelledby="login-preview-title">
          <header><div><span className="login-preview-mark">O</span><div><span className="section-kicker">OPENTRACE</span><h2 id="login-preview-title">Sign in</h2></div></div><button className="icon-button" type="button" aria-label="Close sign in preview" onClick={() => setLoginOpen(false)}><X /></button></header>
          <p>You signed out of the local preview. Authentication is not connected in this PoC, so no credentials are requested or checked.</p>
          <div className="login-preview-account"><div className="user-avatar">AK</div><div><strong>Alex Kim</strong><span>Demo workspace profile</span></div></div>
          <button className="profile-modal-close" type="button" onClick={() => setLoginOpen(false)}>Return to dashboard preview</button>
        </section>
      </div>}
    </>
  )
}
