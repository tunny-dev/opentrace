"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Info,
  Laptop,
  Mail,
  Plus,
  Send,
  Smartphone,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  COOLDOWN_OPTIONS,
  DEFAULT_ALERT_RULES,
  EMAIL_TEMPLATES,
  FORM_METRICS,
  METRIC_UNITS,
  SERVICES,
  SEVERITIES,
  type AlertMetric,
  type AlertRule,
  type AlertSeverity,
  type EmailTemplate,
  type NewRuleDraft,
} from "./alerts-types";

const SEVERITY_COLORS: Record<AlertSeverity, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/30" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30" },
  info: { bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-400", border: "border-sky-500/30" },
};

const METRIC_LABELS: Record<AlertMetric, string> = {
  p95_latency: "Độ trễ phản hồi P95 (ms)",
  error_rate: "Tỷ lệ lỗi hệ thống (%)",
  slow_sql: "Truy vấn CSDL chạy chậm (ms)",
  n_plus_one: "Vòng lặp truy vấn N+1 (statements)",
  "5xx_count": "Lỗi ngoại lệ máy chủ HTTP 500 (exceptions)",
  heartbeat_timeout: "Mất kết nối Heartbeat (seconds)",
};

export function AlertPolicyBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Form State
  const [name, setName] = React.useState("");
  const [service, setService] = React.useState(SERVICES[0]);
  const [metric, setMetric] = React.useState<AlertMetric>("p95_latency");
  const [threshold, setThreshold] = React.useState<number>(400);
  const [severity, setSeverity] = React.useState<AlertSeverity>("warning");
  const [cooldownMins, setCooldownMins] = React.useState<number>(15);
  const [chanEmail, setChanEmail] = React.useState(true);
  const [chanInApp, setChanInApp] = React.useState(true);

  // Email Configuration
  const [recipients, setRecipients] = React.useState<string[]>([
    "devops@senao.com",
    "lead-dev@senao.com",
  ]);
  const [recipientInput, setRecipientInput] = React.useState("");

  // Templates from Database (fallback to built-in EMAIL_TEMPLATES)
  const [templates, setTemplates] = React.useState<EmailTemplate[]>(EMAIL_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("tpl_latency");

  // Preview Toggle: Default false, only open when user clicks button!
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewDevice, setPreviewDevice] = React.useState<"desktop" | "mobile" | "code">("desktop");
  const [isSendingTest, setIsSendingTest] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Load Templates from Database API (/api/telemetry/email-templates)
  React.useEffect(() => {
    fetch("/api/telemetry/email-templates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const dbTemplates: EmailTemplate[] = data.map((t: any) => ({
            id: t.id || crypto.randomUUID(),
            name: t.name,
            category: t.category || "custom",
            subject: t.subject || "[SpurTrace {{Severity}}] Cảnh báo hệ thống: {{AlertTitle}}",
            description: t.description || `Mẫu cấu hình trong cơ sở dữ liệu: ${t.name}`,
            bodyHtml: t.bodyHtml || t.body_html || "",
          }));

          // Merge: ensure standard templates exist if not in DB
          const existingIds = new Set(dbTemplates.map((d) => d.id));
          const merged = [...dbTemplates, ...EMAIL_TEMPLATES.filter((e) => !existingIds.has(e.id))];
          setTemplates(merged);
        }
      })
      .catch(() => {});
  }, []);

  // Load existing rule if editing
  React.useEffect(() => {
    if (!editId) return;

    fetch("/api/telemetry/alerts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const found = data?.rules?.find((r: any) => r.id === editId);
        if (found) {
          setName(found.name || "");
          setService(found.service || SERVICES[0]);
          setMetric((found.metric as AlertMetric) || "p95_latency");
          setThreshold(Number(found.threshold) || 400);
          setSeverity((found.severity as AlertSeverity) || "warning");
          setCooldownMins(Number(found.windowMinutes) || 15);
          if (found.channels) {
            const chs = Array.isArray(found.channels) ? found.channels : String(found.channels).split(",");
            setChanEmail(chs.includes("email"));
            setChanInApp(chs.includes("inApp"));
          }
          if (found.recipients) {
            const list = found.recipients.split(",").map((s: string) => s.trim()).filter(Boolean);
            if (list.length > 0) setRecipients(list);
          }
          if (found.templateId) {
            setSelectedTemplateId(found.templateId);
          }
        }
      })
      .catch(() => {});
  }, [editId]);

  // Auto-suggest template when metric changes
  const handleMetricChange = (m: AlertMetric) => {
    setMetric(m);
    if (m === "slow_sql") {
      setSelectedTemplateId("tpl_slow_query");
      setThreshold(300);
    } else if (m === "5xx_count" || m === "error_rate") {
      setSelectedTemplateId("tpl_critical");
      setSeverity("critical");
      setThreshold(m === "5xx_count" ? 1 : 1.0);
    } else if (m === "heartbeat_timeout") {
      setSelectedTemplateId("tpl_health");
      setSeverity("critical");
      setThreshold(30);
    } else {
      setSelectedTemplateId("tpl_latency");
      setThreshold(400);
    }
  };

  // Add recipient email
  const addRecipient = (emailStr: string) => {
    const trimmed = emailStr.trim().replace(/,/g, "");
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Định dạng email không hợp lệ: " + trimmed);
      return;
    }
    if (recipients.includes(trimmed)) {
      toast.warning("Email đã có trong danh sách nhận");
      return;
    }
    setRecipients((prev) => [...prev, trimmed]);
    setRecipientInput("");
  };

  const removeRecipient = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  // Current active template
  const currentTemplate = React.useMemo(() => {
    return (
      templates.find((t) => t.id === selectedTemplateId) ||
      templates[0] ||
      EMAIL_TEMPLATES[0]
    );
  }, [templates, selectedTemplateId]);

  // Compute live rendered HTML with replacements
  const renderedHtml = React.useMemo(() => {
    const raw = currentTemplate.bodyHtml;
    const nowStr = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const displayTitle = name.trim() || `[Cảnh báo] ${METRIC_LABELS[metric]}`;

    return raw
      .replace(/{{AlertTitle}}/g, displayTitle)
      .replace(/{{Severity}}/g, severity.toUpperCase())
      .replace(/{{ServiceName}}/g, service)
      .replace(/{{Endpoint}}/g, "/api/production-report/get-dashboard-detail")
      .replace(/{{DurationMs}}/g, String(threshold))
      .replace(/{{ThresholdMs}}/g, String(threshold))
      .replace(/{{TraceId}}/g, "9d9fd099-1d7e-a76c-276d-f6f45bd496a4")
      .replace(/{{Timestamp}}/g, `${nowStr} (ICT)`)
      .replace(/{{TraceUrl}}/g, "/telemetry/system-logs?tab=stream")
      .replace(
        /{{ErrorMessage}}/g,
        "System.TimeoutException: The execution of the SQL Command exceeded the allotted timeout threshold of 30,000ms.\n   at MESProductionDashboardAPI.Common.Database.LoggingDbConnection.ExecuteQueryAsync()"
      )
      .replace(
        /{{SqlSnippet}}/g,
        "SET NOCOUNT ON;\nSELECT TOP 50 G.MG002, G.MG003, S.outputQty\nFROM SSFMG G WITH (NOLOCK)\nLEFT JOIN StationAgg S ON S.op = G.MG003\nWHERE G.MG001 = @mo AND S.outputQty > 0\nORDER BY G.MG002;"
      );
  }, [currentTemplate, name, severity, service, metric, threshold]);

  // Live Subject Line
  const renderedSubject = React.useMemo(() => {
    return currentTemplate.subject
      .replace(/{{AlertTitle}}/g, name.trim() || METRIC_LABELS[metric])
      .replace(/{{Severity}}/g, severity.toUpperCase())
      .replace(/{{ServiceName}}/g, service)
      .replace(/{{Endpoint}}/g, "/api/production-report/get-dashboard-detail")
      .replace(/{{DurationMs}}/g, String(threshold))
      .replace(/{{ThresholdMs}}/g, String(threshold));
  }, [currentTemplate, name, severity, service, threshold, metric]);

  // Send Test Email
  const handleSendTestEmail = async () => {
    if (recipients.length === 0) {
      toast.error("Vui lòng nhập ít nhất 1 email người nhận.");
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await fetch("/api/telemetry/alerts/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleName: name.trim() || `[SpurTrace Test] ${METRIC_LABELS[metric]}`,
          severity,
          recipients: recipients.join(", "),
          templateId: selectedTemplateId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã gửi email thử nghiệm thành công tới ${recipients.length} địa chỉ.`);
      } else {
        toast.error(`Gửi mail thất bại: ${data.message || "Kiểm tra cấu hình SMTP"}`);
      }
    } catch (e: any) {
      toast.error(`Lỗi kết nối gửi email: ${e.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Save Alert Rule
  const handleSaveRule = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập Tên chính sách cảnh báo.");
      return;
    }
    if (chanEmail && recipients.length === 0) {
      toast.error("Đã bật kênh gửi Email, vui lòng nhập ít nhất 1 email người nhận.");
      return;
    }

    setIsSaving(true);
    try {
      // Standard UUID format
      const ruleUuid = editId || crypto.randomUUID();

      const payload = {
        id: ruleUuid,
        name: name.trim(),
        service,
        metric,
        threshold: Number(threshold),
        unit: METRIC_UNITS[metric] || "ms",
        severity,
        channels: [chanEmail ? "email" : "", chanInApp ? "inApp" : ""].filter(Boolean).join(","),
        recipients: recipients.join(", "),
        templateId: selectedTemplateId,
        isEnabled: true,
      };

      const res = await fetch("/api/telemetry/alerts/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editId ? "Đã cập nhật chính sách cảnh báo thành công!" : "Đã tạo chính sách cảnh báo mới thành công!");
        window.location.href = "/telemetry/alerts";
      } else {
        toast.error("Lỗi khi lưu chính sách cảnh báo vào cơ sở dữ liệu.");
      }
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full px-2 sm:px-4 lg:px-6 pb-12 transition-all">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/alerts">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại</span>
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">
                {editId ? "Chỉnh sửa chính sách cảnh báo" : "Tạo chính sách cảnh báo tùy chỉnh"}
              </h1>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-sky-500 border-sky-500/30 bg-sky-500/10">
                Email Template Studio
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Gán email người nhận và xem trước giao diện email cảnh báo tương thích hoàn hảo với Outlook & Gmail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Preview Toggle Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className={`h-8 gap-1.5 text-xs transition ${
              showPreview
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/40 font-semibold"
                : "text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{showPreview ? "Ẩn xem trước" : "Xem trước Email (Live Preview)"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTestEmail}
            disabled={isSendingTest || recipients.length === 0}
            className="h-8 gap-1.5 text-xs border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSendingTest ? "Đang gửi..." : "Gửi thử email"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSaveRule}
            disabled={isSaving}
            className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{isSaving ? "Đang lưu..." : "Lưu chính sách"}</span>
          </Button>
        </div>
      </div>

      {/* Main Content:
          - If showPreview is false: Centered spacious form (max-w-4xl mx-auto)
          - If showPreview is true: Responsive Grid (Left Form 5 cols | Right Live Preview 7 cols)
      */}
      <div className={showPreview ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" : "max-w-4xl mx-auto w-full"}>
        {/* Left Column: Form Controls */}
        <div className={showPreview ? "lg:col-span-5 flex flex-col gap-5" : "flex flex-col gap-5 w-full"}>
          {/* Section 1: Basic Info */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border text-xs font-bold text-foreground uppercase tracking-wider">
              <Bell className="h-3.5 w-3.5 text-sky-500" />
              <span>1. Thông tin chính sách</span>
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground mb-1 block">Tên chính sách cảnh báo *</Label>
              <Input
                placeholder="VD: [PROD] Độ trễ P95 cao trên MES-API (> 400ms)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs focus-visible:ring-1 focus-visible:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-foreground mb-1 block">Service áp dụng</Label>
                <Select value={service} onValueChange={(val) => setService(val ?? SERVICES[0])}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Chọn dịch vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-foreground mb-1 block">Mức độ nghiêm trọng</Label>
                <Select value={severity} onValueChange={(val: any) => setSeverity(val)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((sev) => (
                      <SelectItem key={sev} value={sev} className="text-xs uppercase font-semibold">
                        <span className={SEVERITY_COLORS[sev].text}>{sev}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Metric & Condition */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border text-xs font-bold text-foreground uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>2. Điều kiện kích hoạt sự cố</span>
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground mb-1 block">Chỉ số giám sát (Metric)</Label>
              <Select value={metric} onValueChange={(v: any) => handleMetricChange(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORM_METRICS.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {METRIC_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-foreground mb-1 block">
                  Giá trị ngưỡng ({METRIC_UNITS[metric]})
                </Label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-foreground mb-1 block">Thời gian làm nguội</Label>
                <Select
                  value={String(cooldownMins)}
                  onValueChange={(v) => setCooldownMins(Number(v))}
                >
                  <SelectTrigger className="h-8 text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COOLDOWN_OPTIONS.map((min) => (
                      <SelectItem key={min} value={String(min)} className="text-xs">
                        {min} phút
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-1">
              <Label className="text-xs font-medium text-foreground mb-1.5 block">Kênh gửi cảnh báo</Label>
              <div className="flex items-center gap-5 flex-wrap">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <Checkbox checked={chanEmail} onCheckedChange={(c) => setChanEmail(!!c)} />
                  <span>Email Outlook / SMTP</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <Checkbox checked={chanInApp} onCheckedChange={(c) => setChanInApp(!!c)} />
                  <span>Banner thông báo trong app</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Email Recipients & Template Assignment */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/20 p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                <Mail className="h-3.5 w-3.5" />
                <span>3. Gán Email & Mẫu thông báo</span>
              </div>
              <Badge variant="outline" className="text-[10px] text-sky-500 border-sky-500/30">
                {recipients.length} người nhận
              </Badge>
            </div>

            {/* Email Recipients Tag Input */}
            <div>
              <Label className="text-xs font-medium text-foreground mb-1 block">
                Danh sách email nhận thông báo *
              </Label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="email"
                  placeholder="Nhập email và bấm Thêm (vd: dev@senao.com)..."
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addRecipient(recipientInput);
                    }
                  }}
                  className="h-8 text-xs bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addRecipient(recipientInput)}
                  className="h-8 px-3 text-xs shrink-0"
                >
                  <Plus className="h-3 w-3 mr-1" /> Thêm
                </Button>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded border border-border bg-background">
                {recipients.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic">
                    Chưa có email nào. Hãy nhập email phía trên.
                  </span>
                ) : (
                  recipients.map((email, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25"
                    >
                      <Mail className="h-2.5 w-2.5 opacity-70" />
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(idx)}
                        className="ml-0.5 hover:text-rose-500 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Quick suggestion buttons */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-muted-foreground">
                <span>Gợi ý nhanh:</span>
                <button
                  type="button"
                  onClick={() => addRecipient("devops@senao.com")}
                  className="text-sky-600 dark:text-sky-400 hover:underline"
                >
                  + devops@senao.com
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => addRecipient("backend-team@senao.com")}
                  className="text-sky-600 dark:text-sky-400 hover:underline"
                >
                  + backend-team@senao.com
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => addRecipient("mes-admin@senao.com")}
                  className="text-sky-600 dark:text-sky-400 hover:underline"
                >
                  + mes-admin@senao.com
                </button>
              </div>
            </div>

            {/* Template Selector with Preview Trigger Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Mẫu giao diện email (Load động từ Database)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {templates.length} mẫu có sẵn
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Select
                    value={selectedTemplateId}
                    onValueChange={(val) => setSelectedTemplateId(val ?? "tpl_latency")}
                  >
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {templates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id} className="text-xs py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground">{tpl.name}</span>
                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                              {tpl.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Direct button to open preview right at the template picker */}
                {!showPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    className="h-9 px-3 text-xs gap-1.5 shrink-0 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/10"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Xem trước mẫu này</span>
                  </Button>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground mt-1.5">
                💡 Mẫu email được đồng bộ trực tiếp từ cơ sở dữ liệu `spurtrace.email_templates`.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Email Preview (Shown ONLY when showPreview is true) */}
        {showPreview && (
          <div className="lg:col-span-7 flex flex-col gap-3 sticky top-4 animate-in fade-in-50 duration-200">
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
              {/* Window Topbar simulating Email Client */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-semibold text-foreground ml-2">
                    Xem trước Email (Live Preview)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Device Preview Toggle */}
                  <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition ${
                        previewDevice === "desktop"
                          ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Desktop View (600px)"
                    >
                      <Laptop className="h-3 w-3" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition ${
                        previewDevice === "mobile"
                          ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Mobile View (375px)"
                    >
                      <Smartphone className="h-3 w-3" />
                      <span>Mobile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("code")}
                      className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition ${
                        previewDevice === "code"
                          ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="View HTML Source"
                    >
                      <span>HTML</span>
                    </button>
                  </div>

                  {/* Close Preview Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Đóng xem trước"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Email Metadata Header Bar */}
              <div className="p-3 bg-muted/20 border-b border-border space-y-1.5 text-xs font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-muted-foreground font-medium shrink-0">Từ (From):</span>
                  <span className="font-semibold text-foreground">
                    SpurTrace APM Alerts &lt;telemetry@senao.com&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-muted-foreground font-medium shrink-0">Đến (To):</span>
                  <div className="flex flex-wrap gap-1">
                    {recipients.length === 0 ? (
                      <span className="text-rose-500 font-medium">Chưa có người nhận nào</span>
                    ) : (
                      recipients.map((r, i) => (
                        <span key={i} className="text-sky-600 dark:text-sky-400 font-mono text-[11px]">
                          {r}{i < recipients.length - 1 ? "," : ""}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-muted-foreground font-medium shrink-0">Tiêu đề:</span>
                  <span className="font-semibold text-foreground text-xs line-clamp-1">
                    {renderedSubject}
                  </span>
                </div>
              </div>

              {/* Email Body Rendering Box */}
              <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[580px] overflow-auto">
                {previewDevice === "code" ? (
                  <div className="w-full h-[540px] overflow-auto bg-black p-4 rounded-lg font-mono text-[11px] text-emerald-400 border border-slate-800 leading-relaxed select-text">
                    <pre>{renderedHtml}</pre>
                  </div>
                ) : (
                  <div
                    className={`transition-all duration-300 mx-auto shadow-2xl rounded-xl overflow-hidden border border-slate-700 bg-white dark:bg-slate-900 ${
                      previewDevice === "mobile" ? "w-[375px]" : "w-full max-w-[620px]"
                    }`}
                  >
                    <iframe
                      title="Live Email Template Preview"
                      srcDoc={renderedHtml}
                      className="w-full h-[560px] border-none bg-transparent"
                      sandbox="allow-same-origin"
                    />
                  </div>
                )}
              </div>

              {/* Bottom Info Footer */}
              <div className="p-3 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-sky-500" />
                  <span>Email chuẩn responsive HTML tương thích hoàn hảo Outlook & Mobile.</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(renderedHtml);
                    toast.success("Đã sao chép mã nguồn HTML của email");
                  }}
                  className="h-6 text-[11px] gap-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>Sao chép HTML</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
