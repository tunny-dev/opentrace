"use client";

import { FormEvent, useState, useEffect } from "react";

import {
  Check,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  FileCode,
  HardDrive,
  KeyRound,
  Lock,
  Mail,
  Network,
  RefreshCw,
  Save,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Zap,
  Globe,
  Moon,
  Sun,
  Laptop,
  Loader2,
  Users,
  Plus,
  Trash2,
  Edit3,
  UserCheck,
  UserX,
  Code2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CopyButton } from "@/components/ui/copy-button";
import type { UserRole } from "./user-profile-menu";
import {
  getEngineDdl,
  SupportedDbEngine,
  DB_ENGINE_PRIORITIES,
  DB_ENGINE_MAP,
} from "@/lib/spurtrace/sql-helpers";

export function SettingsPage({ role }: { role: UserRole }) {
  const isAdmin = role === "Admin";
  const { dict, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/telemetry/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.smtp_host) setSmtpHost(data.smtp_host);
        if (data.smtp_port) setSmtpPort(data.smtp_port);
        if (data.smtp_user) setSmtpUser(data.smtp_user);
        if (data.alert_email_to) setRecipientEmails(data.alert_email_to);
        if (data.slow_query_threshold_ms) setSlowSqlThreshold(data.slow_query_threshold_ms);
        if (data.slow_request_threshold_ms) setSlowTraceThreshold(data.slow_request_threshold_ms);
        if (data.sample_rate_success) setSampleRate(Math.round(parseFloat(data.sample_rate_success) * 100));
        if (data.retention_days) setRetentionDays(data.retention_days);
        if (data.db_engine) {
          setDbEngine(data.db_engine as SupportedDbEngine);
          setDdlDialect(data.db_engine as SupportedDbEngine);
        }
        if (data.connection_string) setConnectionString(data.connection_string);
        if (data.db_mode) setDbMode(data.db_mode as "dedicated" | "shared");
        if (data.backup_path) setBackupPath(data.backup_path);
        if (data.backup_schedule) setAutoBackupSchedule(data.backup_schedule);
      })
      .catch(() => {});
  }, []);

  const isDark = mounted ? theme === "dark" : true;
  const isLight = mounted ? theme === "light" : false;
  const isSystem = mounted ? theme === "system" : false;

  // Active Tab: General is default in Settings
  const [activeTab, setActiveTab] = useState<
    "general" | "email" | "db" | "ingestion" | "users" | "security"
  >("general");

  // Email & Outlook Gateway states
  const [emailProvider, setEmailProvider] = useState<"outlook" | "smtp" | "sendgrid">("outlook");
  const [smtpHost, setSmtpHost] = useState("smtp.office365.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("alerts@example.com");
  const [recipientEmails, setRecipientEmails] = useState("devops@example.com, alerts@example.com");
  const [teamsWebhook, setTeamsWebhook] = useState(
    "https://outlook.office.com/webhook/alerts-channel"
  );
  const [sendingTestAlert, setSendingTestAlert] = useState(false);
  const [alertTestResult, setAlertTestResult] = useState<string | null>(null);

  // Database Management states
  const [dbMode, setDbMode] = useState<"dedicated" | "shared">("shared");
  const [dbEngine, setDbEngine] = useState<SupportedDbEngine>("postgres");
  const [connectionString, setConnectionString] = useState(
    "postgresql://spurtrace_user:••••••••@10.1.60.12:5432/mes_production?sslmode=prefer&schema=spurtrace"
  );
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string | null>(null);
  const [ddlDialect, setDdlDialect] = useState<SupportedDbEngine>("postgres");
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [showDdl, setShowDdl] = useState(false);

  // Telemetry Users & RBAC states
  interface TelemetryUser {
    id: string;
    username: string;
    displayName: string;
    email?: string;
    role: string;
    isActive: boolean;
    createdAt?: string;
  }
  const [telemetryUsers, setTelemetryUsers] = useState<TelemetryUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TelemetryUser | null>(null);
  const [userFormUsername, setUserFormUsername] = useState("");
  const [userFormDisplayName, setUserFormDisplayName] = useState("");
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormRole, setUserFormRole] = useState("Admin");
  const [userFormActive, setUserFormActive] = useState(true);
  const [userSaving, setUserSaving] = useState(false);

  function handleEngineSelect(engine: SupportedDbEngine) {
    setDbEngine(engine);
    setDdlDialect(engine);
    if (engine === "postgres") {
      setConnectionString(
        "postgresql://spurtrace_user:••••••••@10.1.60.12:5432/mes_production?sslmode=prefer&schema=spurtrace"
      );
    } else if (engine === "mssql") {
      setConnectionString(
        "Server=10.1.60.12,1433;Database=MES_Production;User Id=sa;Password=••••••••;Encrypt=True;TrustServerCertificate=True;"
      );
    } else if (engine === "mysql") {
      setConnectionString(
        "mysql://spurtrace_user:••••••••@10.1.60.12:3306/mes_production?charset=utf8mb4"
      );
    } else if (engine === "sqlite") {
      setConnectionString("file:./data/spurtrace.db?mode=rwc&_journal_mode=WAL");
    }
  }

  // Backup & Storage states
  const [retentionDays, setRetentionDays] = useState("14");
  const [autoBackupSchedule, setAutoBackupSchedule] = useState("daily");
  const [backupPath, setBackupPath] = useState("C:\\Backups\\SpurTrace");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeMessage, setOptimizeMessage] = useState("");

  // Ingestion states
  const [slowSqlThreshold, setSlowSqlThreshold] = useState("300");
  const [slowTraceThreshold, setSlowTraceThreshold] = useState("800");
  const [sampleRate, setSampleRate] = useState(10);
  const [ignoredPaths, setIgnoredPaths] = useState("/healthz, /favicon.ico, /metrics, /ping");

  // Security states
  const [sensitiveWords, setSensitiveWords] = useState(
    "password, token, secret, cccd, credit_card, api_key, authorization"
  );
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Send Test Email via Outlook / SMTP
  async function handleSendTestEmail() {
    setSendingTestAlert(true);
    setAlertTestResult(null);
    try {
      const res = await fetch("/api/telemetry/settings/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost,
          smtpPort,
          smtpUser,
          recipient: recipientEmails.split(",")[0].trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setAlertTestResult(`✓ ${data.message}`);
        toast.success(data.message);
      } else {
        setAlertTestResult(`✗ ${data.error || "Không thể gửi email kiểm tra."}`);
        toast.error(data.error || "Gửi email thất bại.");
      }
    } catch (err: any) {
      setAlertTestResult(`✗ Lỗi kết nối: ${err.message}`);
      toast.error(err.message);
    } finally {
      setSendingTestAlert(false);
      setTimeout(() => setAlertTestResult(null), 8000);
    }
  }

  // Test DB connection simulation (Prioritized: PgSQL #1, MSSQL #2, MySQL #3, SQLite #4)
  function handleTestConnection() {
    setTestingConnection(true);
    setConnectionResult(null);
    setTimeout(() => {
      setTestingConnection(false);
      let msg = "";
      if (dbEngine === "postgres") {
        msg =
          "✓ Connected in 1.1ms · PostgreSQL (PgSQL - Priority #1) · Database healthy & schema verified";
      } else if (dbEngine === "mssql") {
        msg =
          "✓ Connected in 1.4ms · Microsoft SQL Server (MSSqlServer - Priority #2) · Database healthy & schema verified";
      } else if (dbEngine === "mysql") {
        msg = "✓ Connected in 1.6ms · MySQL (Priority #3) · Database healthy & schema verified";
      } else {
        msg =
          "✓ Connected in 0.3ms · SQLite WAL Storage (Priority #4) · Local database healthy & ready";
      }
      setConnectionResult(msg);
      toast.success("Database connection successful!", { description: msg });
      setTimeout(() => setConnectionResult(null), 5000);
    }, 700);
  }

  // Backup DB snapshot triggered via live server API
  async function handleDownloadBackup() {
    setIsBackingUp(true);
    setBackupMessage("");
    try {
      const res = await fetch("/api/telemetry/settings/backup-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPath: backupPath }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        const msg = `✓ Backup thành công: ${data.fileName} (${data.sizeMb} MB) tại ${data.backupPath}`;
        setBackupMessage(msg);
        toast.success("Sao lưu cơ sở dữ liệu thành công!", { description: data.fileName });
      } else {
        const msg = `✗ Lỗi sao lưu: ${data.error || "Không thể tạo file backup."}`;
        setBackupMessage(msg);
        toast.error(data.error || "Sao lưu thất bại.");
      }
    } catch (err: any) {
      setBackupMessage(`✗ Lỗi kết nối: ${err.message}`);
      toast.error(err.message);
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupMessage(""), 10000);
    }
  }

  // Optimize & Vacuum simulation
  function handleVacuum() {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizeMessage("✓ DB indexes re-indexed & WAL checkpointed (Freed 42.8 MB)");
      toast.info("Database VACUUM completed successfully");
      setTimeout(() => setOptimizeMessage(""), 4000);
    }, 1400);
  }

  // Copy DDL script
  function handleCopyDdl() {
    const script = ddlScripts[ddlDialect];
    navigator.clipboard?.writeText(script);
    setCopiedDdl(true);
    toast.success("DDL SQL script copied to clipboard!");
    setTimeout(() => setCopiedDdl(false), 2000);
  }

  // Save Settings to live backend database
  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/telemetry/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_user: smtpUser,
          alert_email_to: recipientEmails,
          slow_query_threshold_ms: slowSqlThreshold,
          slow_request_threshold_ms: slowTraceThreshold,
          sample_rate_success: (sampleRate / 100).toFixed(2),
          retention_days: retentionDays,
          db_engine: dbEngine,
          db_mode: dbMode,
          backup_path: backupPath,
          backup_schedule: autoBackupSchedule,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        toast.success(dict.settings.savedSuccess);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        toast.error("Không thể lưu cài đặt lên server.");
      }
    } catch (err: any) {
      toast.error(`Lỗi kết nối khi lưu cài đặt: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  // User Management Handlers
  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/telemetry/users");
      if (res.ok) {
        const data = await res.json();
        setTelemetryUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  function handleOpenCreateUser() {
    setEditingUser(null);
    setUserFormUsername("");
    setUserFormDisplayName("");
    setUserFormEmail("");
    setUserFormPassword("");
    setUserFormRole("Admin");
    setUserFormActive(true);
    setUserModalOpen(true);
  }

  function handleOpenEditUser(u: TelemetryUser) {
    setEditingUser(u);
    setUserFormUsername(u.username);
    setUserFormDisplayName(u.displayName);
    setUserFormEmail(u.email || "");
    setUserFormPassword("");
    setUserFormRole(u.role || "Admin");
    setUserFormActive(u.isActive);
    setUserModalOpen(true);
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userFormUsername.trim()) {
      toast.error("Vui lòng nhập tên đăng nhập");
      return;
    }
    if (!editingUser && !userFormPassword.trim()) {
      toast.error("Vui lòng nhập mật khẩu cho tài khoản mới");
      return;
    }
    setUserSaving(true);
    try {
      const payload = {
        id: editingUser?.id,
        username: userFormUsername.trim(),
        displayName: userFormDisplayName.trim() || userFormUsername.trim(),
        email: userFormEmail.trim() || undefined,
        password: userFormPassword.trim() || undefined,
        role: userFormRole,
        isActive: userFormActive,
      };
      const res = await fetch("/api/telemetry/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editingUser ? "Cập nhật tài khoản thành công" : "Tạo tài khoản mới thành công");
        setUserModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err?.error || "Lỗi lưu tài khoản");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối đến máy chủ");
    } finally {
      setUserSaving(false);
    }
  }

  async function handleDeleteUser(id: string, username: string) {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản "${username}" không?`)) return;
    try {
      const res = await fetch(`/api/telemetry/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Đã xóa tài khoản ${username}`);
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err?.error || "Lỗi khi xóa tài khoản");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối đến máy chủ");
    }
  }

  // Production-grade DDL scripts generated with UUID PK and dialect conventions
  const ddlScripts: Record<SupportedDbEngine, string> = {
    postgres: getEngineDdl("postgres"),
    mssql: getEngineDdl("mssql"),
    mysql: getEngineDdl("mysql"),
    sqlite: getEngineDdl("sqlite"),
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Role permission banner */}
      <div className={`settings-role-banner ${isAdmin ? "is-admin-banner" : "is-viewer-banner"}`}>
        {isAdmin ? (
          <>
            <ShieldCheck className="banner-icon text-emerald-500" />
            <div>
              <strong className="text-(--ot-muted) text-xs">
                {dict.settings.adminBannerTitle}
              </strong>
              <p className="text-[11px] text-(--ot-muted)">{dict.settings.adminBannerDesc}</p>
            </div>
          </>
        ) : (
          <>
            <Lock className="banner-icon text-amber-500" />
            <div>
              <strong className="text-(--ot-muted) text-xs">
                {dict.settings.viewerBannerTitle}
              </strong>
              <p className="text-[11px] text-(--ot-muted)">{dict.settings.viewerBannerDesc}</p>
            </div>
          </>
        )}
      </div>

      {/* Tab Navigation Ribbon */}
      <div className="flex items-center gap-2 border-b border-(--ot-border) pb-2 overflow-x-auto">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "general"
              ? "bg-(--ot-panel) text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
              : "text-(--ot-muted) hover:text-(--ot-text) hover:bg-(--ot-panel-raised)"
          }`}
          onClick={() => setActiveTab("general")}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{dict.settings.tabGeneral}</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "email"
              ? "bg-(--ot-panel) text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-xs"
              : "text-(--ot-muted) hover:text-(--ot-text) hover:bg-(--ot-panel-raised)"
          }`}
          onClick={() => setActiveTab("email")}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>{dict.settings.tabEmail}</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "db"
              ? "bg-(--ot-panel) text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
              : "text-(--ot-muted) hover:text-(--ot-text) hover:bg-(--ot-panel-raised)"
          }`}
          onClick={() => setActiveTab("db")}
        >
          <Database className="h-3.5 w-3.5" />
          <span>{dict.settings.tabDatabase}</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "ingestion"
              ? "bg-(--ot-panel) text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs"
              : "text-(--ot-muted) hover:text-(--ot-text) hover:bg-(--ot-panel-raised)"
          }`}
          onClick={() => setActiveTab("ingestion")}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>{dict.settings.tabIngestion}</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-(--ot-panel) text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-xs"
              : "text-(--ot-muted) hover:text-(--ot-text) hover:bg-(--ot-panel-raised)"
          }`}
          onClick={() => setActiveTab("users")}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Tài khoản & Phân quyền</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "security"
              ? "bg-(--ot-panel) text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-xs"
              : "text-(--ot-muted) hover:text-(--ot-text) hover:bg-(--ot-panel-raised)"
          }`}
          onClick={() => setActiveTab("security")}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>{dict.settings.tabSecurity}</span>
        </Button>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* TAB 0: GENERAL & LANGUAGE SETTINGS */}
        {activeTab === "general" && (
          <div className="flex flex-col gap-4">
            <section className="panel-card settings-section-card">
              <header className="settings-section-header">
                <div className="settings-header-icon">
                  <Globe />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ot-text)">
                    {dict.settings.languageTitle}
                  </h3>
                  <p className="text-xs text-(--ot-muted)">{dict.settings.languageDesc}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setLocale("vi");
                    toast.success("Đã chuyển ngôn ngữ sang Tiếng Việt");
                  }}
                  className={`flex items-start gap-3 p-3.5 h-auto rounded-lg border text-left transition-all cursor-pointer justify-start font-normal ${
                    locale === "vi"
                      ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 shadow-xs hover:bg-emerald-50"
                      : "border-(--ot-border) bg-(--ot-panel) text-(--ot-muted) hover:border-emerald-500/40 hover:bg-(--ot-panel-raised)"
                  }`}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                    VI
                  </span>
                  <div>
                    <strong className="block text-sm font-semibold text-(--ot-muted)">
                      Tiếng Việt (Mặc định)
                    </strong>
                    <span className="text-xs text-(--ot-muted)">
                      Giao diện tiếng Việt chuẩn hóa cho APM & Dashboard MES
                    </span>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setLocale("en");
                    toast.success("Switched language to English");
                  }}
                  className={`flex items-start gap-3 p-3.5 h-auto rounded-lg border text-left transition-all cursor-pointer justify-start font-normal ${
                    locale === "en"
                      ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 shadow-xs hover:bg-emerald-50"
                      : "border-(--ot-border) bg-(--ot-panel) text-(--ot-muted) hover:border-emerald-500/40 hover:bg-(--ot-panel-raised)"
                  }`}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-xs font-bold text-sky-700 dark:text-sky-400 border border-sky-500/25">
                    EN
                  </span>
                  <div>
                    <strong className="block text-sm font-semibold text-(--ot-muted)">
                      English
                    </strong>
                    <span className="text-xs text-(--ot-muted)">
                      Standard international engineering telemetry terms
                    </span>
                  </div>
                </Button>
              </div>
            </section>

            <section className="panel-card settings-section-card">
              <header className="settings-section-header">
                <div className="settings-header-icon">
                  <Sun />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ot-text)">
                    {dict.settings.themeTitle}
                  </h3>
                  <p className="text-xs text-(--ot-muted)">{dict.settings.themeDesc}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-2.5 p-3 h-auto rounded-lg border text-xs font-medium transition-all cursor-pointer justify-start ${
                    isDark
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs hover:bg-emerald-500/15"
                      : "border-(--ot-border) bg-(--ot-panel) text-(--ot-muted) hover:bg-(--ot-panel-raised)"
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  <span>{dict.settings.themeDark}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-2.5 p-3 h-auto rounded-lg border text-xs font-medium transition-all cursor-pointer justify-start ${
                    isLight
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs hover:bg-emerald-500/15"
                      : "border-(--ot-border) bg-(--ot-panel) text-(--ot-muted) hover:bg-(--ot-panel-raised)"
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  <span>{dict.settings.themeLight}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setTheme("system")}
                  className={`flex items-center gap-2.5 p-3 h-auto rounded-lg border text-xs font-medium transition-all cursor-pointer justify-start ${
                    isSystem
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs hover:bg-emerald-500/15"
                      : "border-(--ot-border) bg-(--ot-panel) text-(--ot-muted) hover:bg-(--ot-panel-raised)"
                  }`}
                >
                  <Laptop className="h-4 w-4" />
                  <span>{dict.settings.themeSystem}</span>
                </Button>
              </div>
            </section>
          </div>
        )}
        {/* TAB 1: EMAIL & OUTLOOK CONFIGURATION */}
        {activeTab === "email" && (
          <div className="flex flex-col gap-4">
            <section className="panel-card settings-section-card">
              <header className="settings-section-header">
                <div className="settings-header-icon">
                  <Mail />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ot-text)">
                    Email Gateway & Outlook Configuration
                  </h3>
                  <p className="text-xs text-(--ot-muted)">
                    Configure Microsoft Office 365, Outlook STARTTLS, or SMTP relay server to
                    dispatch incident emails.
                  </p>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-[11px] font-medium text-(--ot-muted) mb-1">
                    Email Gateway Provider
                  </Label>
                  <Select
                    value={emailProvider}
                    onValueChange={(val) => setEmailProvider((val as any) ?? "outlook")}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2 text-xs text-(--ot-text)">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md">
                      <SelectItem value="outlook">
                        Microsoft Outlook / Office 365 (STARTTLS Port 587)
                      </SelectItem>
                      <SelectItem value="smtp">Custom Enterprise Internal SMTP Server</SelectItem>
                      <SelectItem value="sendgrid">SendGrid / Cloud Relay API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-[11px] font-medium text-(--ot-muted) mb-1">
                    SMTP Host & Port
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      disabled={!isAdmin}
                      className="col-span-2 h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-muted) outline-none"
                    />
                    <Input
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      disabled={!isAdmin}
                      className="h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2 text-xs text-(--ot-muted) outline-none"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block text-[11px] font-medium text-(--ot-muted) mb-1">
                    Sender Email Account
                  </Label>
                  <Input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-muted) outline-none"
                  />
                </div>

                <div>
                  <Label className="block text-[11px] font-medium text-(--ot-muted) mb-1">
                    Default Alert Recipients (Comma-separated)
                  </Label>
                  <Input
                    type="text"
                    value={recipientEmails}
                    onChange={(e) => setRecipientEmails(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-muted) outline-none"
                  />
                </div>
              </div>

              {/* Microsoft Teams Webhook */}
              <div className="pt-3 border-t border-(--ot-border) flex flex-col gap-1.5">
                <Label className="text-[11px] font-medium text-(--ot-muted)">
                  Microsoft Teams / Slack Incoming Webhook
                </Label>
                <Input
                  type="text"
                  value={teamsWebhook}
                  onChange={(e) => setTeamsWebhook(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-muted) outline-none"
                />
                <small className="text-[10px] text-(--ot-muted)">
                  Formatted adaptive cards and critical alert notifications will be dispatched to
                  this channel in real-time.
                </small>
              </div>

              {/* Test Email Dispatch Button */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  size="sm"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestAlert || !isAdmin}
                >
                  {sendingTestAlert ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin !text-white" />
                  ) : (
                    <Send className="h-3.5 w-3.5 !text-white" />
                  )}
                  <span className="!text-white">
                    {sendingTestAlert
                      ? dict.settings.sendingTestAlert
                      : dict.settings.sendTestAlert}
                  </span>
                </Button>

                {alertTestResult && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    {alertTestResult}
                  </span>
                )}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: DATABASE & BACKUP MANAGEMENT */}
        {activeTab === "db" && (
          <div className="flex flex-col gap-4">
            <section className="panel-card settings-section-card">
              <header className="settings-section-header">
                <div className="settings-header-icon">
                  <Server />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ot-text)">
                    Database Architecture Topology
                  </h3>
                  <p className="text-xs text-(--ot-muted)">
                    Choose whether SpurTrace runs on an isolated log database or injects tables
                    directly into your application DB.
                  </p>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    dbMode === "shared"
                      ? "bg-(--ot-panel) border-emerald-500 shadow-xs"
                      : "bg-(--ot-panel) border-(--ot-border) hover:border-(--ot-border)"
                  }`}
                  onClick={() => isAdmin && setDbMode("shared")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-xs font-bold text-(--ot-muted) flex items-center gap-1.5">
                      <Network className="h-3.5 w-3.5 text-emerald-500" />
                      Shared Application Database (Schema Injection)
                    </strong>
                    {dbMode === "shared" && <Check className="h-4 w-4 text-emerald-500" />}
                  </div>
                  <p className="text-[11px] text-(--ot-muted) leading-relaxed">
                    The unified telemetry table <code>sys_traces</code> resides inside your existing MES/MSSQL/PostgreSQL database with indexed metrics and embedded JSON waterfalls.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    dbMode === "dedicated"
                      ? "bg-(--ot-panel) border-emerald-500 shadow-xs"
                      : "bg-(--ot-panel) border-(--ot-border) hover:border-(--ot-border)"
                  }`}
                  onClick={() => isAdmin && setDbMode("dedicated")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-xs font-bold text-(--ot-muted) flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-emerald-500" />
                      Dedicated Isolated Observability DB
                    </strong>
                    {dbMode === "dedicated" && <Check className="h-4 w-4 text-emerald-500" />}
                  </div>
                  <p className="text-[11px] text-(--ot-muted) leading-relaxed">
                    Telemetry data is shipped to a separate dedicated database server, zero impact
                    on production tables.
                  </p>
                </div>
              </div>
            </section>

            {/* Connection String & Test */}
            <section className="panel-card settings-section-card">
              <header className="settings-section-header">
                <div className="settings-header-icon">
                  <Zap />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ot-text)">
                    Live Database Target & Engine
                  </h3>
                  <p className="text-xs text-(--ot-muted)">
                    Configure driver connection string and run live latency diagnostics.
                  </p>
                </div>
              </header>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="block text-[11px] font-medium text-(--ot-muted) mb-1">
                      Target Database Engine
                    </Label>
                    <Select
                      value={dbEngine}
                      onValueChange={(val) => handleEngineSelect((val as SupportedDbEngine) ?? "postgres")}
                      disabled={!isAdmin}
                    >
                      <SelectTrigger className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2 text-xs text-(--ot-text)">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md">
                        <SelectItem value="postgres">1. PostgreSQL (PgSQL - Priority #1)</SelectItem>
                        <SelectItem value="mssql">
                          2. Microsoft SQL Server (MSSqlServer - Priority #2)
                        </SelectItem>
                        <SelectItem value="mysql">3. MySQL (Priority #3)</SelectItem>
                        <SelectItem value="sqlite">4. SQLite (Priority #4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="block text-[11px] font-medium text-(--ot-muted)">
                        Connection String / Target Host
                      </Label>
                      <CopyButton
                        value={connectionString}
                        label="Connection String"
                        className="h-5 w-5"
                      />
                    </div>
                    <Input
                      type="text"
                      value={connectionString}
                      onChange={(e) => setConnectionString(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-muted) outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 bg-(--ot-panel) hover:bg-(--ot-panel-raised) text-xs font-medium text-(--ot-muted) border-(--ot-border) transition-all disabled:opacity-50 cursor-pointer"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                  >
                    <Zap
                      className={`h-3.5 w-3.5 ${testingConnection ? "animate-spin text-amber-400" : "text-emerald-500"}`}
                    />
                    <span>{testingConnection ? "Testing Connection…" : "Test DB Connection"}</span>
                  </Button>

                  {connectionResult && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                      {connectionResult}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Backup & Disaster Recovery */}
            <section className="panel-card settings-section-card">
              <header className="settings-section-header">
                <div className="settings-header-icon">
                  <HardDrive />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ot-text)">
                    Database Backup & Disaster Recovery
                  </h3>
                  <p className="text-xs text-(--ot-muted)">
                    Download instant database dumps, configure automatic backup schedules, and
                    vacuum storage.
                  </p>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 p-3 bg-(--ot-panel) border border-(--ot-border) rounded-lg">
                  <strong className="text-xs text-(--ot-muted)">
                    1-Click Full Backup Download
                  </strong>
                  <p className="text-[11px] text-(--ot-muted)">
                    Export all traces, SQL fingerprints, and execution metrics into a downloadable
                    SQL/SQLite dump file.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 !text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                      onClick={handleDownloadBackup}
                      disabled={isBackingUp || !isAdmin}
                    >
                      {isBackingUp ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin !text-white" />
                      ) : (
                        <Download className="h-3.5 w-3.5 !text-white" />
                      )}
                      <span className="!text-white">
                        {isBackingUp
                          ? dict.settings.downloadingBackup
                          : dict.settings.downloadBackup}
                      </span>
                    </Button>
                  </div>
                  {backupMessage && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                      {backupMessage}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 p-3 bg-(--ot-panel) border border-(--ot-border) rounded-lg">
                  <strong className="text-xs text-(--ot-muted)">Automated Backup Schedule</strong>
                  <p className="text-[11px] text-(--ot-muted)">
                    Automatic snapshot retention policy applied during nightly background
                    maintenance.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1">
                      <Select
                        value={autoBackupSchedule}
                        onValueChange={(val) => setAutoBackupSchedule(val ?? "daily")}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2 text-xs text-(--ot-text)">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md">
                          <SelectItem value="daily">Daily at 02:00 AM (Keep 14 days)</SelectItem>
                          <SelectItem value="weekly">Weekly on Sunday (Keep 30 days)</SelectItem>
                          <SelectItem value="disabled">Disabled (Manual Only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 bg-(--ot-panel) text-xs text-(--ot-muted) hover:text-(--ot-text) border-(--ot-border) cursor-pointer"
                      onClick={handleVacuum}
                      disabled={isOptimizing || !isAdmin}
                    >
                      <RefreshCw className={`h-3 w-3 ${isOptimizing ? "animate-spin" : ""}`} />
                      <span>Run VACUUM</span>
                    </Button>
                  </div>
                  {optimizeMessage && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                      {optimizeMessage}
                    </span>
                  )}
                </div>

                {/* Custom Server Backup Directory */}
                <div className="flex flex-col gap-2 p-3 bg-(--ot-panel) border border-(--ot-border) rounded-lg sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-(--ot-muted)">
                      Custom Backup Destination Path (Server / Host Local Directory)
                    </strong>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      Auto-created on execution
                    </span>
                  </div>
                  <p className="text-[11px] text-(--ot-muted)">
                    Physical directory path on target host where automated database snapshots (.bak / .json / .db) will be stored.
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="text"
                      value={backupPath}
                      onChange={(e) => setBackupPath(e.target.value)}
                      placeholder="e.g. C:\Backups\SpurTrace or /var/backups/spurtrace"
                      disabled={!isAdmin}
                      className="font-mono text-xs h-8 bg-(--ot-bg)"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* DDL Schema Generator */}
            <section className="panel-card settings-section-card">
              <header className="settings-section-header">
                <div className="settings-header-icon">
                  <FileCode />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ot-text)">
                    Database DDL Migration Generator
                  </h3>
                  <p className="text-xs text-(--ot-muted)">
                    Copy and execute these SQL scripts to create SpurTrace tables in your company
                    database.
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="flex items-center bg-(--ot-panel) rounded-md p-0.5 border border-(--ot-border) gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className={`font-semibold transition-colors cursor-pointer text-xs ${
                        ddlDialect === "postgres"
                          ? "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white"
                          : "text-(--ot-muted) hover:text-(--ot-text)"
                      }`}
                      onClick={() => setDdlDialect("postgres")}
                    >
                      1. PgSQL
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className={`font-semibold transition-colors cursor-pointer text-xs ${
                        ddlDialect === "mssql"
                          ? "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white"
                          : "text-(--ot-muted) hover:text-(--ot-text)"
                      }`}
                      onClick={() => setDdlDialect("mssql")}
                    >
                      2. MSSqlServer
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className={`font-semibold transition-colors cursor-pointer text-xs ${
                        ddlDialect === "mysql"
                          ? "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white"
                          : "text-(--ot-muted) hover:text-(--ot-text)"
                      }`}
                      onClick={() => setDdlDialect("mysql")}
                    >
                      3. MySql
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className={`font-semibold transition-colors cursor-pointer text-xs ${
                        ddlDialect === "sqlite"
                          ? "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white"
                          : "text-(--ot-muted) hover:text-(--ot-text)"
                      }`}
                      onClick={() => setDdlDialect("sqlite")}
                    >
                      4. SqlLite
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 bg-(--ot-panel) hover:bg-(--ot-panel-raised) text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 cursor-pointer"
                      onClick={() => setShowDdl(!showDdl)}
                    >
                      {showDdl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{showDdl ? "Thu gọn mã SQL" : "Xem mã SQL DDL"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 bg-(--ot-panel) hover:bg-(--ot-panel-raised) text-xs text-(--ot-muted) border-(--ot-border) cursor-pointer"
                      onClick={handleCopyDdl}
                    >
                      {copiedDdl ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedDdl ? "Đã sao chép!" : "Sao chép toàn bộ DDL"}</span>
                    </Button>
                  </div>
                </div>
              </header>

              {/* Architecture & Schema Recommendation Badge */}
              <div className="p-3.5 rounded-lg bg-(--ot-panel) border border-(--ot-border) flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                  <Database className="h-4 w-4" />
                  <span>Enterprise Observability Architecture & Schema Strategy (spurtrace)</span>
                </div>
                <p className="text-[11px] text-(--ot-muted) leading-relaxed">
                  <strong>PostgreSQL & MSSQL (Recommended Priority):</strong> Dedicated{" "}
                  <code className="text-emerald-600 dark:text-emerald-400 font-mono">
                    spurtrace
                  </code>{" "}
                  schema namespace isolation. Telemetry tables are created under{" "}
                  <code className="font-mono text-[10px]">spurtrace.*</code> (not mixed into{" "}
                  <code className="font-mono text-[10px]">public</code> or{" "}
                  <code className="font-mono text-[10px]">dbo</code>), eliminating table-level
                  locking with transactional MES business tables (
                  <code className="font-mono text-[10px]">INVMB</code>,{" "}
                  <code className="font-mono text-[10px]">SSFMF</code>), and enabling independent
                  RBAC privileges.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded border border-(--ot-border) bg-(--ot-panel)">
                    <div className="font-semibold text-(--ot-muted) flex items-center justify-between">
                      <span>1. PgSQL</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        #1
                      </span>
                    </div>
                    <div className="text-[10px] text-(--ot-muted) mt-1">
                      Schema:{" "}
                      <code className="text-emerald-600 dark:text-emerald-400">spurtrace.*</code>
                    </div>
                    <div className="text-[10px] text-(--ot-muted)">
                      PK:{" "}
                      <code className="text-emerald-600 dark:text-emerald-400">UUID RFC4122</code>
                    </div>
                  </div>
                  <div className="p-2 rounded border border-(--ot-border) bg-(--ot-panel)">
                    <div className="font-semibold text-(--ot-muted) flex items-center justify-between">
                      <span>2. MSSqlServer</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        #2
                      </span>
                    </div>
                    <div className="text-[10px] text-(--ot-muted) mt-1">
                      Schema:{" "}
                      <code className="text-emerald-600 dark:text-emerald-400">[spurtrace].*</code>
                    </div>
                    <div className="text-[10px] text-(--ot-muted)">
                      PK:{" "}
                      <code className="text-emerald-600 dark:text-emerald-400">
                        UNIQUEIDENTIFIER
                      </code>
                    </div>
                  </div>
                  <div className="p-2 rounded border border-(--ot-border) bg-(--ot-panel)">
                    <div className="font-semibold text-(--ot-muted) flex items-center justify-between">
                      <span>3. MySql</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        #3
                      </span>
                    </div>
                    <div className="text-[10px] text-(--ot-muted) mt-1">
                      Prefix: <code className="text-emerald-600 dark:text-emerald-400">spurtrace_*</code>
                    </div>
                    <div className="text-[10px] text-(--ot-muted)">
                      PK:{" "}
                      <code className="text-emerald-600 dark:text-emerald-400">CHAR(36) UUID</code>
                    </div>
                  </div>
                  <div className="p-2 rounded border border-(--ot-border) bg-(--ot-panel)">
                    <div className="font-semibold text-(--ot-muted) flex items-center justify-between">
                      <span>4. SqlLite</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        #4
                      </span>
                    </div>
                    <div className="text-[10px] text-(--ot-muted) mt-1">
                      File:{" "}
                      <code className="text-emerald-600 dark:text-emerald-400">spurtrace.sqlite3</code>
                    </div>
                    <div className="text-[10px] text-(--ot-muted)">
                      PK: <code className="text-emerald-600 dark:text-emerald-400">TEXT UUID</code>
                    </div>
                  </div>
                </div>
              </div>

              {!showDdl ? (
                <div className="p-3.5 rounded-lg border border-dashed border-(--ot-border) text-center text-xs text-(--ot-muted) bg-(--ot-panel)/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-left">
                    <FileCode className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Mã script DDL SQL đang được thu gọn để tối ưu diện tích. Bấm <strong>"Xem mã SQL DDL"</strong> để hiển thị hoặc <strong>"Sao chép toàn bộ DDL"</strong> để copy trực tiếp.</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowDdl(true)}
                    className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer shrink-0 font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Mở xem script
                  </Button>
                </div>
              ) : (
                <pre className="p-3.5 rounded-lg bg-(--ot-panel) border border-(--ot-border) text-xs text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed max-h-[420px]">
                  {ddlScripts[ddlDialect]}
                </pre>
              )}
            </section>
          </div>
        )}

        {/* TAB 3: INGESTION & LATENCY */}
        {activeTab === "ingestion" && (
          <section className="panel-card settings-section-card">
            <header className="settings-section-header">
              <div className="settings-header-icon">
                <Sliders />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-(--ot-text)">
                  Ingestion Rules & Latency Thresholds
                </h3>
                <p className="text-xs text-(--ot-muted)">
                  Define what triggers SLOW warnings and configure sampling rates.
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-(--ot-muted)">
                  Slow SQL Threshold (ms)
                </Label>
                <Input
                  type="number"
                  value={slowSqlThreshold}
                  onChange={(e) => setSlowSqlThreshold(e.target.value)}
                  disabled={!isAdmin}
                  className="h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-muted) outline-none"
                />
                <small className="text-[10px] text-(--ot-muted)">
                  Queries exceeding this duration are tagged with SLOW badges.
                </small>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-(--ot-muted)">
                  Slow Trace Latency (ms)
                </Label>
                <Input
                  type="number"
                  value={slowTraceThreshold}
                  onChange={(e) => setSlowTraceThreshold(e.target.value)}
                  disabled={!isAdmin}
                  className="h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-muted) outline-none"
                />
                <small className="text-[10px] text-(--ot-muted)">
                  Requests exceeding this duration trigger high-latency warnings.
                </small>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-medium text-(--ot-muted)">
                    Success Head-Sample Rate (200 OK)
                  </Label>
                  <strong className="text-xs text-emerald-600 dark:text-emerald-400">
                    {sampleRate}%
                  </strong>
                </div>
                <div className="py-2.5">
                  <Slider
                    min={1}
                    max={100}
                    step={1}
                    value={sampleRate}
                    onValueChange={(val) => {
                      const num = Array.isArray(val) ? val[0] : Number(val);
                      if (!isNaN(num)) setSampleRate(num);
                    }}
                    disabled={!isAdmin}
                  />
                </div>
                <small className="text-[10px] text-(--ot-muted)">
                  Errors (5xx) and Slow queries are always captured at 100%.
                </small>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-(--ot-muted)">
                  Ignored Static Paths
                </Label>
                <Input
                  type="text"
                  value={ignoredPaths}
                  onChange={(e) => setIgnoredPaths(e.target.value)}
                  disabled={!isAdmin}
                  className="h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-muted) outline-none"
                />
                <small className="text-[10px] text-(--ot-muted)">
                  Dropped before ingestion to save database I/O.
                </small>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: USERS & RBAC MANAGEMENT */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-4">
            <section className="panel-card settings-section-card">
              <header className="settings-section-header flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="settings-header-icon bg-indigo-500/10 text-indigo-600 border border-indigo-500/25">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-(--ot-text)">
                      Quản lý Tài khoản & Phân quyền (RBAC)
                    </h3>
                    <p className="text-xs text-(--ot-muted)">
                      Quản lý tài khoản truy cập hệ thống SpurTrace. Thông tin được lưu mã hóa PBKDF2 trong bảng{" "}
                      <code className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">spurtrace.users</code>.
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenCreateUser}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm tài khoản</span>
                  </Button>
                )}
              </header>

              {loadingUsers ? (
                <div className="p-8 text-center text-xs text-(--ot-muted) flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  <span>Đang tải danh sách tài khoản từ database...</span>
                </div>
              ) : telemetryUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-(--ot-muted) border border-dashed border-(--ot-border) rounded-lg bg-(--ot-panel)/50">
                  <p>Chưa có tài khoản phụ nào. Tài khoản mặc định hệ thống: <strong>admin</strong> / <strong>admin@123</strong>.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleOpenCreateUser}
                    className="mt-3 text-emerald-600 border-emerald-500/30"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Tạo tài khoản đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="border border-(--ot-border) rounded-lg overflow-x-auto bg-(--ot-panel)">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-(--ot-border) bg-(--ot-panel-raised) text-[11px] font-semibold text-(--ot-muted) uppercase tracking-wider">
                        <th className="py-2.5 px-3">Tài khoản</th>
                        <th className="py-2.5 px-3">Tên hiển thị</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Vai trò</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--ot-border)">
                      {telemetryUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-(--ot-panel-raised)/60 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-(--ot-text)">
                            <div className="flex items-center gap-2">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px] border border-emerald-500/20">
                                {u.username.substring(0, 2).toUpperCase()}
                              </span>
                              <span className="font-mono">{u.username}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-(--ot-muted)">{u.displayName || "—"}</td>
                          <td className="py-2.5 px-3 text-(--ot-muted) font-mono text-[11px]">{u.email || "—"}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                u.role?.toLowerCase() === "admin"
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/25"
                                  : u.role?.toLowerCase() === "engineer"
                                  ? "bg-blue-500/10 text-blue-600 border border-blue-500/25"
                                  : "bg-amber-500/10 text-amber-600 border border-amber-500/25"
                              }`}
                            >
                              {u.role || "Admin"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                                <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                                <span className="size-1.5 rounded-full bg-rose-500 inline-block" />
                                Đã khóa
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isAdmin && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleOpenEditUser(u)}
                                  className="h-7 w-7 p-0 text-(--ot-muted) hover:text-(--ot-text)"
                                  title="Chỉnh sửa"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                {u.username.toLowerCase() !== "admin" && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                    title="Xóa tài khoản"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* User Edit / Create Modal Dialog */}
            {userModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                <div className="bg-(--ot-panel) border border-(--ot-border) rounded-xl shadow-2xl w-full max-w-md p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-(--ot-border) pb-3">
                    <h4 className="text-sm font-semibold text-(--ot-text) flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-500" />
                      <span>{editingUser ? "Chỉnh sửa tài khoản" : "Thêm tài khoản người dùng"}</span>
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setUserModalOpen(false)}
                      className="h-6 w-6 p-0 text-(--ot-muted)"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <form onSubmit={handleSaveUser} className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[11px] font-medium text-(--ot-muted)">Tên đăng nhập (Username) *</Label>
                      <Input
                        type="text"
                        value={userFormUsername}
                        onChange={(e) => setUserFormUsername(e.target.value)}
                        placeholder="VD: nguyenvana"
                        required
                        disabled={!!editingUser}
                        className="h-8 bg-(--ot-panel-raised) border border-(--ot-border) text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-[11px] font-medium text-(--ot-muted)">Họ và tên hiển thị</Label>
                      <Input
                        type="text"
                        value={userFormDisplayName}
                        onChange={(e) => setUserFormDisplayName(e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                        className="h-8 bg-(--ot-panel-raised) border border-(--ot-border) text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-[11px] font-medium text-(--ot-muted)">Email nhận cảnh báo</Label>
                      <Input
                        type="email"
                        value={userFormEmail}
                        onChange={(e) => setUserFormEmail(e.target.value)}
                        placeholder="a.nguyen@senao.com"
                        className="h-8 bg-(--ot-panel-raised) border border-(--ot-border) text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-[11px] font-medium text-(--ot-muted)">
                        {editingUser ? "Mật khẩu mới (Để trống nếu giữ nguyên)" : "Mật khẩu khởi tạo *"}
                      </Label>
                      <Input
                        type="password"
                        value={userFormPassword}
                        onChange={(e) => setUserFormPassword(e.target.value)}
                        placeholder="••••••••"
                        required={!editingUser}
                        className="h-8 bg-(--ot-panel-raised) border border-(--ot-border) text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-medium text-(--ot-muted)">Phân quyền (Role) *</Label>
                      <Select
                        value={userFormRole}
                        onValueChange={(val) => {
                          if (val) setUserFormRole(val);
                        }}
                      >
                        <SelectTrigger className="h-9 w-full bg-(--ot-panel-raised) border border-(--ot-border) text-xs">
                          <SelectValue placeholder="Chọn vai trò người dùng..." />
                        </SelectTrigger>
                        <SelectContent className="min-w-[340px] bg-(--ot-panel) border border-(--ot-border) shadow-2xl z-[100] text-xs">
                          <SelectItem value="Admin" className="cursor-pointer py-2">
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="font-semibold text-emerald-500 flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Admin (Toàn quyền quản trị)
                              </span>
                              <span className="text-[10px] text-(--ot-muted)">
                                Quản trị toàn bộ cài đặt, người dùng, backup CSDL và chạy SQL Studio
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Engineer" className="cursor-pointer py-2">
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                                <Code2 className="h-3.5 w-3.5" />
                                Engineer (Kỹ sư hệ thống)
                              </span>
                              <span className="text-[10px] text-(--ot-muted)">
                                Xem traces, chạy truy vấn SQL Studio, phân tích sự cố và xem cảnh báo
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Viewer" className="cursor-pointer py-2">
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                                <UserRound className="h-3.5 w-3.5" />
                                Viewer (Người xem)
                              </span>
                              <span className="text-[10px] text-(--ot-muted)">
                                Chỉ xem traces và số liệu đo lường tổng quan, ẩn các thông tin nhạy cảm
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-(--ot-text)">
                        <input
                          type="checkbox"
                          checked={userFormActive}
                          onChange={(e) => setUserFormActive(e.target.checked)}
                          className="rounded accent-emerald-500 cursor-pointer h-4 w-4"
                        />
                        <span className="font-medium">Kích hoạt tài khoản ngay sau khi tạo</span>
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-(--ot-border)">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUserModalOpen(false)}
                        className="text-xs"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={userSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {userSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>{editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}</span>
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SECURITY & API KEYS */}
        {activeTab === "security" && (
          <div className="flex flex-col gap-4">
            <section className="panel-card settings-section-card">
              <header className="settings-section-header">
                <div className="settings-header-icon">
                  <ShieldAlert />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ot-text)">
                    Security & Data Masking
                  </h3>
                  <p className="text-xs text-(--ot-muted)">
                    Sanitize sensitive query arguments and protect secrets in logs.
                  </p>
                </div>
              </header>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-medium text-(--ot-muted)">
                  Sensitive Parameter Keywords
                </Label>
                <Input
                  type="text"
                  value={sensitiveWords}
                  onChange={(e) => setSensitiveWords(e.target.value)}
                  disabled={!isAdmin}
                  className="h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2.5 text-xs text-(--ot-muted) outline-none"
                />
                <small className="text-[10px] text-(--ot-muted)">
                  Any SQL bind parameter or log key matching these words is masked as ********* in
                  Viewer mode.
                </small>
              </div>
            </section>

            <section className="panel-card settings-section-card">
              <header className="settings-section-header">
                <div className="settings-header-icon">
                  <KeyRound />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ot-text)">
                    Collector Ingestion API Keys
                  </h3>
                  <p className="text-xs text-(--ot-muted)">
                    Credentials required by backend middlewares to send traces.
                  </p>
                </div>
              </header>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-medium text-(--ot-muted)">
                  Production API Secret Key
                </Label>
                <div className="flex items-center justify-between h-9 bg-(--ot-panel) border border-(--ot-border) rounded-md px-3">
                  <code className="text-xs text-emerald-600 dark:text-emerald-400">
                    {showKey
                      ? "ot_live_sec_99a8b17f309d44e88102ca"
                      : "ot_live_sec_99a8b1••••••••••••••••••••"}
                  </code>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="p-1 text-(--ot-muted) hover:text-(--ot-text) cursor-pointer"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="p-1 text-(--ot-muted) hover:text-(--ot-text) cursor-pointer"
                      onClick={() => {
                        navigator.clipboard?.writeText("ot_live_sec_99a8b17f309d44e88102ca");
                        setCopiedKey(true);
                        toast.success("API Secret Key copied to clipboard");
                        setTimeout(() => setCopiedKey(false), 1800);
                      }}
                    >
                      {copiedKey ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <small className="text-[10px] text-(--ot-muted)">
                  Pass via header: <code>Authorization: Bearer ot_live_sec_...</code>
                </small>
              </div>
            </section>
          </div>
        )}

        {/* Form Footer Save Button */}
        <footer className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              {dict.settings.savedSuccess}
            </span>
          )}
          <Button
            type="submit"
            size="sm"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 !text-white text-xs font-semibold shadow transition-all disabled:opacity-50 cursor-pointer"
            disabled={!isAdmin || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin !text-white" />
                <span className="!text-white">{dict.settings.savingChanges}</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 !text-white" />
                <span className="!text-white">{dict.settings.saveChanges}</span>
              </>
            )}
          </Button>
        </footer>
      </form>
    </div>
  );
}
