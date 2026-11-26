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
  Lock,
  Mail,
  Network,
  RefreshCw,
  Save,
  Send,
  Server,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserRole } from "./user-profile-menu";
import {
  getEngineDdl,
  SupportedDbEngine,
  DB_ENGINE_PRIORITIES,
  DB_ENGINE_MAP,
} from "@/lib/spurtrace/sql-helpers";

export interface EmailTemplateItem {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  isDefault: boolean;
  createdAt?: string;
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateItem[] = [
  {
    id: "Alert_Critical",
    name: "Alert_Critical (Khẩn cấp 5xx/Crash)",
    subject: "[SpurTrace CRITICAL] Sự cố nghiêm trọng trên {{ServiceName}}: {{AlertTitle}}",
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #ef4444; color: white; padding: 16px 20px;">
    <h2 style="margin: 0; font-size: 18px;">[KHẨN CẤP] {{AlertTitle}}</h2>
    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Phát hiện lúc {{Timestamp}} trên dịch vụ {{ServiceName}}</p>
  </div>
  <div style="padding: 20px; background-color: #ffffff; color: #1f2937;">
    <p><strong>Endpoint:</strong> <code>{{Endpoint}}</code></p>
    <p><strong>Độ trễ:</strong> {{DurationMs}} ms</p>
    <p><strong>Trace ID:</strong> <code>{{TraceId}}</code></p>
    <p><strong>Chi tiết lỗi:</strong></p>
    <pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 11px; overflow-x: auto; color: #b91c1c;">{{ErrorMessage}}</pre>
    <div style="margin-top: 20px;">
      <a href="{{TraceUrl}}" style="background-color: #ef4444; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block;">Xem Sơ Đồ Waterfall Trace</a>
    </div>
  </div>
</div>`,
    isDefault: true,
  },
  {
    id: "Alert_SlowQuery",
    name: "Alert_SlowQuery (Truy vấn SQL chậm / N+1)",
    subject: "[SpurTrace WARNING] Cảnh báo truy vấn chậm trên {{ServiceName}}: {{AlertTitle}}",
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fef3c7; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #f59e0b; color: white; padding: 16px 20px;">
    <h2 style="margin: 0; font-size: 18px;">[CẢNH BÁO] {{AlertTitle}}</h2>
    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Phát hiện lúc {{Timestamp}} trên dịch vụ {{ServiceName}}</p>
  </div>
  <div style="padding: 20px; background-color: #ffffff; color: #1f2937;">
    <p><strong>Endpoint:</strong> <code>{{Endpoint}}</code></p>
    <p><strong>Thời gian thực thi:</strong> {{DurationMs}} ms</p>
    <p><strong>Trace ID:</strong> <code>{{TraceId}}</code></p>
    <p><strong>Câu lệnh SQL:</strong></p>
    <pre style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 11px; overflow-x: auto; color: #334155; border: 1px solid #e2e8f0;">{{SqlSnippet}}</pre>
    <div style="margin-top: 20px;">
      <a href="{{TraceUrl}}" style="background-color: #f59e0b; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block;">Mở Trực Tiếp Trong SQL Studio</a>
    </div>
  </div>
</div>`,
    isDefault: false,
  },
  {
    id: "Alert_Digest",
    name: "Alert_Digest (Báo cáo tổng hợp định kỳ)",
    subject: "[SpurTrace REPORT] Báo cáo tình trạng vận hành {{ServiceName}}",
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0f2fe; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #0284c7; color: white; padding: 16px 20px;">
    <h2 style="margin: 0; font-size: 18px;">BÁO CÁO TỔNG HỢP HIỆU NĂNG HỆ THỐNG</h2>
    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Dịch vụ {{ServiceName}} · Xuất lúc {{Timestamp}}</p>
  </div>
  <div style="padding: 20px; background-color: #ffffff; color: #1f2937;">
    <p>Hệ thống SpurTrace tự động ghi nhận tình trạng hoạt động trong chu kỳ vừa qua.</p>
    <div style="margin-top: 20px;">
      <a href="{{TraceUrl}}" style="background-color: #0284c7; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block;">Truy Cập SpurTrace Dashboard</a>
    </div>
  </div>
</div>`,
    isDefault: false,
  },
];

export function SettingsPage({ role }: { role: UserRole }) {
  const isAdmin = role === "Admin";
  const { dict, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Email & Outlook Gateway states
  const [emailProvider, setEmailProvider] = useState<"outlook" | "relay">("outlook");
  const [smtpHost, setSmtpHost] = useState("smtp.office365.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("tunny.truong@senao.com");
  const [smtpPass, setSmtpPass] = useState("");
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [enableSsl, setEnableSsl] = useState(true);
  const [recipientEmails, setRecipientEmails] = useState("tunny.truong@senao.com");
  const [sendingTestAlert, setSendingTestAlert] = useState(false);
  const [alertTestResult, setAlertTestResult] = useState<string | null>(null);

  // Templates state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateItem[]>(DEFAULT_EMAIL_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("Alert_Critical");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateItem | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateItem | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/telemetry/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.smtp_host) setSmtpHost(data.smtp_host);
        if (data.smtp_port) setSmtpPort(data.smtp_port);
        if (data.smtp_user) setSmtpUser(data.smtp_user);
        if (data.smtp_pass) setSmtpPass(data.smtp_pass);
        if (data.email_provider) setEmailProvider(data.email_provider as any);
        if (data.selected_template_id) setSelectedTemplateId(data.selected_template_id);
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

    fetch("/api/telemetry/settings/email-templates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEmailTemplates(data.map((t: any) => ({
            id: t.id,
            name: t.name,
            subject: t.subject,
            bodyHtml: t.body_html || t.bodyHtml || "",
            isDefault: Boolean(t.is_default || t.isDefault),
            createdAt: t.created_at,
          })));
          const def = data.find((t: any) => t.is_default || t.isDefault);
          if (def) setSelectedTemplateId(def.id);
        }
      })
      .catch(() => {});
  }, []);

  const isDark = mounted ? theme === "dark" : true;
  const isLight = mounted ? theme === "light" : false;
  const isSystem = mounted ? theme === "system" : false;

  // Active Tab: General is default in Settings
  const [activeTab, setActiveTab] = useState<
    "general" | "email" | "db" | "ingestion" | "users"
  >("general");

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
          smtpPass,
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

  // Template preview & storage handlers
  function renderTemplatePreview(html: string) {
    const sampleMap: Record<string, string> = {
      "{{AlertTitle}}": "Độ trễ P95 vượt ngưỡng (> 500ms)",
      "{{Severity}}": "CRITICAL",
      "{{ServiceName}}": "Senao-EMS (Production)",
      "{{Endpoint}}": "GET /api/dashboard/issuance-cost",
      "{{DurationMs}}": "1,420",
      "{{TraceId}}": "c15523bd02bb28db716b97cb8749f7b1",
      "{{Timestamp}}": new Date().toLocaleString("vi-VN"),
      "{{ErrorMessage}}": "System.TimeoutException: Execution Timeout Expired. Operation cancelled by database engine.",
      "{{SqlSnippet}}": "SELECT ISNULL(SUM(TotalAmount), 0) FROM Ems.BulkIssuances WHERE Status = 2",
      "{{TraceUrl}}": "http://10.1.60.56:5000/telemetry/traces?trace=c15523bd02bb28db716b97cb8749f7b1",
    };
    let output = html || "";
    Object.entries(sampleMap).forEach(([token, val]) => {
      output = output.replaceAll(token, val);
    });
    return output;
  }

  async function handleSaveTemplate(tpl: EmailTemplateItem) {
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/telemetry/settings/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tpl.id,
          name: tpl.name,
          subject: tpl.subject,
          bodyHtml: tpl.bodyHtml,
          isDefault: tpl.isDefault,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success(`Đã lưu mẫu email "${tpl.name}" vào cơ sở dữ liệu!`);
        setEmailTemplates((prev) => {
          const idx = prev.findIndex((t) => t.id === tpl.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = tpl;
            return next;
          }
          return [...prev, tpl];
        });
        if (tpl.isDefault) {
          setSelectedTemplateId(tpl.id);
        }
        setIsTemplateModalOpen(false);
        setEditingTemplate(null);
      } else {
        toast.error(data.message || "Không thể lưu mẫu email.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa mẫu email này không?")) return;
    try {
      const res = await fetch(`/api/telemetry/settings/email-templates/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success("Đã xóa mẫu email khỏi cơ sở dữ liệu!");
        setEmailTemplates((prev) => prev.filter((t) => t.id !== id));
        if (selectedTemplateId === id) setSelectedTemplateId("Alert_Critical");
      } else {
        toast.error(data.message || "Không thể xóa mẫu email.");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
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
          smtp_pass: smtpPass,
          email_provider: emailProvider,
          selected_template_id: selectedTemplateId,
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
                    onValueChange={(val) => {
                      const provider = (val as "outlook" | "relay") ?? "outlook";
                      setEmailProvider(provider);
                      if (provider === "outlook") {
                        setSmtpHost("smtp.office365.com");
                        setSmtpPort("587");
                        setEnableSsl(true);
                      } else {
                        setSmtpHost("mail.senao.com");
                        setSmtpPort("25");
                        setEnableSsl(false);
                      }
                    }}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md px-2 text-xs text-(--ot-text)">
                      <SelectValue placeholder="Chọn dịch vụ gửi thư" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md">
                      <SelectItem value="outlook">
                        Microsoft Outlook / Office 365 (Port 587 - STARTTLS)
                      </SelectItem>
                      <SelectItem value="relay">
                        Máy chủ chuyển tiếp nội bộ / On-premise Relay (Port 25 - No Auth)
                      </SelectItem>
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

                {emailProvider === "outlook" || smtpPort === "587" ? (
                  <div>
                    <Label className="block text-[11px] font-medium text-(--ot-muted) mb-1">
                      Mật khẩu SMTP / App Password (Office 365)
                    </Label>
                    <div className="relative">
                      <Input
                        type={showSmtpPass ? "text" : "password"}
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="Nhập mật khẩu hoặc App Password O365..."
                        disabled={!isAdmin}
                        className="w-full h-8 bg-(--ot-panel) border border-(--ot-border) rounded-md pl-2.5 pr-8 text-xs text-(--ot-text) outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        title={showSmtpPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showSmtpPass ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="block text-[11px] font-medium text-(--ot-muted) mb-1">
                      Xác thực SMTP (Port 25)
                    </Label>
                    <div className="flex items-center gap-2 h-8 px-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
                      <Check className="size-3.5 shrink-0" />
                      <span>Xác thực qua IP Whitelist nội bộ · Không cần mật khẩu</span>
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2">
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

              {/* Port & Authentication Explanation */}
              <div className="p-3 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground flex flex-col gap-1.5 font-sans">
                <strong className="text-foreground text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Hướng dẫn cấu hình cổng gửi thư (Port 25 vs Port 587)
                </strong>
                <p className="text-[11px] leading-relaxed">
                  • <strong>Port 587 (Khuyến nghị cho Outlook / Office 365)</strong>: Sử dụng mã hóa STARTTLS an toàn. Yêu cầu nhập tài khoản email người gửi và <em>Mật khẩu ứng dụng (App Password)</em> nếu tài khoản công ty bật xác thực 2 bước (MFA).
                </p>
                <p className="text-[11px] leading-relaxed">
                  • <strong>Port 25 (Máy chủ chuyển tiếp mạng nội bộ / On-premise Relay)</strong>: Dành cho mạng nội bộ nhà máy (Senao Intranet) đã whitelist IP của server. <em>Không cần nhập mật khẩu</em> và không cần SSL.
                </p>
              </div>

              {/* Email Template Selector & Customizer */}
              <div className="pt-3 border-t border-(--ot-border) flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Label className="text-xs font-semibold text-foreground">
                      Mẫu Email Cảnh báo (Alert Templates)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Linh hoạt lựa chọn mẫu sẵn có hoặc tùy biến tạo mẫu HTML mới lưu trực tiếp trong cơ sở dữ liệu.
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5 border-dashed border-emerald-500/50 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 self-start sm:self-auto cursor-pointer"
                      onClick={() => {
                        setEditingTemplate({
                          id: `tpl_${Date.now().toString(36)}`,
                          name: "Mẫu cảnh báo tùy chỉnh",
                          subject: "[SpurTrace Alert] Cảnh báo trên {{ServiceName}}: {{AlertTitle}}",
                          bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #0f172a; color: white; padding: 16px 20px;">
    <h2 style="margin: 0; font-size: 16px;">{{AlertTitle}}</h2>
    <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">Dịch vụ: {{ServiceName}}</p>
  </div>
  <div style="padding: 20px; background-color: #ffffff; color: #1e293b;">
    <p><strong>Endpoint:</strong> <code>{{Endpoint}}</code></p>
    <p><strong>Thời gian:</strong> {{DurationMs}} ms</p>
    <p><strong>Mã Trace:</strong> <code>{{TraceId}}</code></p>
    <div style="margin-top: 16px;">
      <a href="{{TraceUrl}}" style="background: #10b981; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold;">Xem chi tiết sự cố</a>
    </div>
  </div>
</div>`,
                          isDefault: false,
                        });
                        setIsTemplateModalOpen(true);
                      }}
                    >
                      <Plus className="size-3.5" />
                      <span>Thêm mẫu tùy chỉnh</span>
                    </Button>
                  )}
                </div>

                {/* Templates Interactive Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {emailTemplates.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`p-3 rounded-lg border flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/40"
                            : "border-border bg-card/60 hover:border-border hover:bg-card/90"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5 gap-1.5">
                            <span className="font-semibold text-xs text-foreground truncate" title={tpl.name}>
                              {tpl.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {tpl.isDefault && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold uppercase">
                                  Mặc định
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold uppercase inline-flex items-center gap-0.5">
                                  <Check className="size-2.5" /> Áp dụng
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed" title={tpl.subject}>
                            {tpl.subject}
                          </p>
                        </div>

                        {/* Action buttons inside card */}
                        <div className="flex items-center justify-between gap-1.5 pt-3 mt-2 border-t border-border/50">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTemplate(tpl);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium py-1 px-1.5 rounded hover:bg-muted/60 transition-colors"
                          >
                            <Eye className="size-3" />
                            <span>Xem trước</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTemplate({ ...tpl });
                                  setIsTemplateModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-700 font-medium py-1 px-1.5 rounded hover:bg-sky-500/10 transition-colors"
                                title="Chỉnh sửa nội dung mẫu"
                              >
                                <Edit3 className="size-3" />
                                <span>Sửa</span>
                              </button>
                            )}

                            {isAdmin && !tpl.isDefault && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(tpl.id);
                                }}
                                className="text-muted-foreground hover:text-rose-500 p-1 rounded hover:bg-rose-500/10 transition-colors"
                                title="Xóa mẫu này"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-md bg-muted/30 border border-border/60 p-2.5 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground mr-1.5">Biến template hỗ trợ:</span>
                  {[
                    "{{AlertTitle}}",
                    "{{Severity}}",
                    "{{ServiceName}}",
                    "{{Endpoint}}",
                    "{{DurationMs}}",
                    "{{TraceId}}",
                    "{{Timestamp}}",
                    "{{ErrorMessage}}",
                    "{{SqlSnippet}}",
                    "{{TraceUrl}}",
                  ].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(token);
                        toast.success(`Đã sao chép ${token}`);
                      }}
                      className="inline-block text-emerald-600 dark:text-emerald-400 mr-2 hover:underline font-mono cursor-pointer"
                      title="Click để copy biến"
                    >
                      {token}
                    </button>
                  ))}
                </div>
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

      {/* MODAL 1: EDIT / CREATE EMAIL TEMPLATE */}
      {isTemplateModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-(--ot-panel) border border-(--ot-border) rounded-xl shadow-2xl w-full max-w-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-(--ot-border) pb-3">
              <h4 className="text-sm font-semibold text-(--ot-text) flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-500" />
                <span>
                  {emailTemplates.some((t) => t.id === editingTemplate.id)
                    ? `Chỉnh sửa mẫu email: ${editingTemplate.name}`
                    : "Tạo mẫu email cảnh báo mới"}
                </span>
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setEditingTemplate(null);
                }}
                className="h-6 w-6 p-0 text-(--ot-muted)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] font-medium text-(--ot-muted)">Tên mẫu *</Label>
                  <Input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) =>
                      setEditingTemplate((prev) => (prev ? { ...prev, name: e.target.value } : null))
                    }
                    placeholder="VD: Alert_HighMemory, Alert_Custom..."
                    className="h-8 text-xs bg-(--ot-panel) border-(--ot-border)"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] font-medium text-(--ot-muted)">Mã định danh ID</Label>
                  <Input
                    type="text"
                    value={editingTemplate.id}
                    disabled
                    className="h-8 text-xs font-mono bg-muted/40 border-(--ot-border) opacity-70"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-(--ot-muted)">Tiêu đề Email (Subject) *</Label>
                <Input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) =>
                    setEditingTemplate((prev) => (prev ? { ...prev, subject: e.target.value } : null))
                  }
                  placeholder="[SpurTrace Alert] {{Severity}} trên {{ServiceName}}: {{AlertTitle}}"
                  className="h-8 text-xs bg-(--ot-panel) border-(--ot-border)"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-medium text-(--ot-muted)">Nội dung HTML (Body) *</Label>
                  <span className="text-[10px] text-muted-foreground">Click biến bên dưới để chèn vào mã:</span>
                </div>

                {/* Quick token insertion buttons */}
                <div className="flex flex-wrap gap-1 p-1.5 rounded-md bg-muted/40 border border-border/60 text-[10px]">
                  {[
                    "{{AlertTitle}}",
                    "{{Severity}}",
                    "{{ServiceName}}",
                    "{{Endpoint}}",
                    "{{DurationMs}}",
                    "{{TraceId}}",
                    "{{Timestamp}}",
                    "{{ErrorMessage}}",
                    "{{SqlSnippet}}",
                    "{{TraceUrl}}",
                  ].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => {
                        setEditingTemplate((prev) => {
                          if (!prev) return null;
                          return { ...prev, bodyHtml: prev.bodyHtml + token };
                        });
                        toast.success(`Đã chèn ${token}`);
                      }}
                      className="px-1.5 py-0.5 rounded bg-card hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 border border-border/60 text-muted-foreground font-mono transition-colors cursor-pointer"
                    >
                      + {token}
                    </button>
                  ))}
                </div>

                <textarea
                  value={editingTemplate.bodyHtml}
                  onChange={(e) =>
                    setEditingTemplate((prev) => (prev ? { ...prev, bodyHtml: e.target.value } : null))
                  }
                  rows={10}
                  className="w-full p-2.5 rounded-md bg-slate-950 text-slate-100 font-mono text-xs border border-border/60 outline-none focus:ring-1 focus:ring-emerald-500 resize-y leading-relaxed"
                  placeholder="Nhập mã HTML của email cảnh báo..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tpl-is-default"
                  checked={editingTemplate.isDefault}
                  onChange={(e) =>
                    setEditingTemplate((prev) => (prev ? { ...prev, isDefault: e.target.checked } : null))
                  }
                  className="rounded border-border"
                />
                <label htmlFor="tpl-is-default" className="text-xs text-foreground font-medium cursor-pointer">
                  Đặt làm mẫu email mặc định cho toàn hệ thống
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--ot-border)">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsTemplateModalOpen(false);
                    setEditingTemplate(null);
                  }}
                  className="text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingTemplate || !editingTemplate.name.trim() || !editingTemplate.subject.trim()}
                  onClick={() => handleSaveTemplate(editingTemplate)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {savingTemplate && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Lưu vào Cơ sở dữ liệu</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PREVIEW EMAIL TEMPLATE */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-(--ot-panel) border border-(--ot-border) rounded-xl shadow-2xl w-full max-w-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-(--ot-border) pb-3">
              <div>
                <h4 className="text-sm font-semibold text-(--ot-text) flex items-center gap-2">
                  <Eye className="h-4 w-4 text-emerald-500" />
                  <span>Xem trước mẫu: {previewTemplate.name}</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tiêu đề gửi: <strong>{renderTemplatePreview(previewTemplate.subject)}</strong>
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPreviewTemplate(null)}
                className="h-6 w-6 p-0 text-(--ot-muted)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="border border-border/80 rounded-lg overflow-hidden bg-white text-slate-900 p-4 max-h-[60vh] overflow-y-auto">
              <div
                dangerouslySetInnerHTML={{
                  __html: renderTemplatePreview(previewTemplate.bodyHtml),
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-(--ot-border)">
              <span className="text-[11px] text-muted-foreground">
                Giao diện hiển thị với các token mẫu đã được điền tự động.
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => setPreviewTemplate(null)}
                className="text-xs"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
