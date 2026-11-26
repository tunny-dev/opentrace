import type { TranslateFn } from "@/lib/i18n/i18n-context";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertChannel = "email" | "inApp";
export type AlertMetric =
  | "p95_latency"
  | "error_rate"
  | "slow_sql"
  | "n_plus_one"
  | "5xx_count"
  | "heartbeat_timeout";

export interface AlertRule {
  id: string;
  /** Free-form name typed by the user. Ignored for display when `nameKey` is set. */
  name: string;
  /** Translation key for built-in presets so they follow the active language. */
  nameKey?: string;
  service: string;
  metric: AlertMetric;
  threshold: number;
  unit: string;
  severity: AlertSeverity;
  channels: Record<AlertChannel, boolean>;
  recipients?: string;
  templateId?: string;
  cooldownMins: number;
  enabled: boolean;
}

export interface IncidentDetail {
  key: "alerts.log.seedException" | "alerts.log.seedSlowSql" | "alerts.log.testDetail";
  metric?: AlertMetric;
  threshold?: number;
  unit?: string;
}

export interface IncidentLog {
  id: string;
  ruleName: string;
  ruleNameKey?: string;
  severity: AlertSeverity;
  minutesAgo: number;
  channels: AlertChannel[];
  details: IncidentDetail;
}

export interface NewRuleDraft {
  name: string;
  service: string;
  metric: AlertMetric;
  threshold: number;
  severity: AlertSeverity;
  channels: Record<AlertChannel, boolean>;
  recipients?: string;
  templateId?: string;
  cooldownMins: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: "critical" | "slow_sql" | "latency" | "deadlock" | "health" | "custom";
  subject: string;
  description: string;
  bodyHtml: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl_critical",
    name: "Sự cố Ngoại lệ & HTTP 500 (Critical Outage)",
    category: "critical",
    subject: "[SpurTrace {{Severity}}] Sự cố ngoại lệ HTTP 500 tại {{ServiceName}}: {{Endpoint}}",
    description: "Dành riêng cho lỗi sập hệ thống, exception chưa bắt được hoặc HTTP 5xx.",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 24px; color: #ffffff;">
      <div style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: rgba(0,0,0,0.3); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.2);">
        {{Severity}} ALERT
      </div>
      <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 700; line-height: 1.3;">⚠️ {{AlertTitle}}</h1>
      <p style="margin: 0; font-size: 13px; opacity: 0.9;">Phát hiện sự cố ngoại lệ máy chủ tại dịch vụ <strong style="color: #fff;">{{ServiceName}}</strong></p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1; margin-top: 0;">
        Hệ thống giám sát SpurTrace APM phát hiện endpoint gặp sự cố không thể xử lý yêu cầu. Vui lòng kiểm tra ngay:
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0; background: #0f172a; border-radius: 8px; overflow: hidden; border: 1px solid #334155;">
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; width: 140px; font-weight: 600;">Dịch vụ (Service):</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-weight: 600;">{{ServiceName}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 600;">Đường dẫn (Endpoint):</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #f43f5e; font-family: monospace; font-weight: 700;">{{Endpoint}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 600;">Thời gian xử lý:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #fb7185; font-weight: 700;">{{DurationMs}} ms</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 600;">Trace ID:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; font-family: monospace; color: #38bdf8; word-break: break-all;">{{TraceId}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #94a3b8; font-weight: 600;">Thời gian phát hiện:</td>
          <td style="padding: 10px 14px; color: #94a3b8;">{{Timestamp}}</td>
        </tr>
      </table>
      <div style="margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 700; color: #f43f5e; margin-bottom: 6px; text-transform: uppercase;">Chi tiết ngoại lệ / Stack Trace:</div>
        <div style="background: #020617; border: 1px solid #e11d48; border-radius: 6px; padding: 14px; font-family: 'Consolas', monospace; font-size: 12px; color: #fda4af; line-height: 1.5; white-space: pre-wrap; word-break: break-all; max-height: 240px; overflow-y: auto;">{{ErrorMessage}}</div>
      </div>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="{{TraceUrl}}" style="display: inline-block; background: #e11d48; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.4);">
          🔍 Phân tích Trace Waterfall trong SpurTrace
        </a>
      </div>
    </div>
    <div style="background: #0f172a; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
      Thông báo tự động từ SpurTrace APM Platform · Senao EMS Production · Không trả lời email này.
    </div>
  </div>
</body>
</html>`
  },
  {
    id: "tpl_slow_query",
    name: "Truy vấn CSDL Chạy Chậm (Slow SQL Query)",
    category: "slow_sql",
    subject: "[SpurTrace {{Severity}}] Truy vấn SQL vượt ngưỡng tại {{ServiceName}}: {{DurationMs}}ms",
    description: "Dành cho cảnh báo thời gian thực thi câu lệnh SQL (Dapper, EF Core, SSMS) chạy quá lâu.",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 24px; color: #ffffff;">
      <div style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: rgba(0,0,0,0.3); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.2);">
        {{Severity}} DATABASE SLOW QUERY
      </div>
      <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 700; line-height: 1.3;">🐢 {{AlertTitle}}</h1>
      <p style="margin: 0; font-size: 13px; opacity: 0.9;">Thời gian thực thi SQL đạt <strong>{{DurationMs}} ms</strong> (Ngưỡng cảnh báo: {{ThresholdMs}} ms)</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1; margin-top: 0;">
        Bộ thu thập dữ liệu SpurTrace DbCommandInterceptor phát hiện truy vấn SQL chạy chậm tại <strong style="color: #f8fafc;">{{ServiceName}}</strong>:
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0; background: #0f172a; border-radius: 8px; overflow: hidden; border: 1px solid #334155;">
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; width: 140px; font-weight: 600;">Dịch vụ gọi:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-weight: 600;">{{ServiceName}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 600;">Thời gian chạy SQL:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #f59e0b; font-weight: 700; font-size: 14px;">{{DurationMs}} ms</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 600;">Ngưỡng cấu hình:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8;">{{ThresholdMs}} ms</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #94a3b8; font-weight: 600;">Trace ID liên quan:</td>
          <td style="padding: 10px 14px; font-family: monospace; color: #38bdf8; word-break: break-all;">{{TraceId}}</td>
        </tr>
      </table>
      <div style="margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 700; color: #f59e0b; margin-bottom: 6px; text-transform: uppercase;">Trích đoạn câu lệnh SQL:</div>
        <div style="background: #020617; border: 1px solid #d97706; border-radius: 6px; padding: 14px; font-family: 'Consolas', monospace; font-size: 12px; color: #fde68a; line-height: 1.5; white-space: pre-wrap; word-break: break-all; max-height: 220px; overflow-y: auto;">{{SqlSnippet}}</div>
      </div>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="{{TraceUrl}}" style="display: inline-block; background: #d97706; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.02em;">
          ⚡ Mở trong SpurTrace SQL Analytics Studio
        </a>
      </div>
    </div>
    <div style="background: #0f172a; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
      Thông báo tự động từ SpurTrace APM Platform · Tối ưu hóa hiệu năng cơ sở dữ liệu.
    </div>
  </div>
</body>
</html>`
  },
  {
    id: "tpl_latency",
    name: "Độ Trễ P95 Tăng Cao (High Latency Spike)",
    category: "latency",
    subject: "[SpurTrace {{Severity}}] Độ trễ P95 tăng vọt tại {{ServiceName}}: {{DurationMs}}ms",
    description: "Dành cho cảnh báo thời gian phản hồi API hoặc endpoint người dùng bị chậm bất thường.",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #ea580c, #c2410c); padding: 24px; color: #ffffff;">
      <div style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: rgba(0,0,0,0.3); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.2);">
        {{Severity}} HIGH LATENCY
      </div>
      <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 700; line-height: 1.3;">📈 {{AlertTitle}}</h1>
      <p style="margin: 0; font-size: 13px; opacity: 0.9;">Độ trễ P95 đạt <strong>{{DurationMs}} ms</strong> vượt ngưỡng an toàn</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1; margin-top: 0;">
        Chỉ số hiệu năng thời gian thực cho thấy dịch vụ <strong style="color: #f8fafc;">{{ServiceName}}</strong> đang phản hồi chậm:
      </p>
      <div style="display: flex; gap: 12px; margin: 20px 0;">
        <div style="flex: 1; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 14px; text-align: center;">
          <div style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">P95 Hiện tại</div>
          <div style="font-size: 24px; font-weight: 800; color: #fb923c; margin-top: 4px;">{{DurationMs}} ms</div>
        </div>
        <div style="flex: 1; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 14px; text-align: center;">
          <div style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Ngưỡng Giới hạn</div>
          <div style="font-size: 24px; font-weight: 800; color: #94a3b8; margin-top: 4px;">{{ThresholdMs}} ms</div>
        </div>
      </div>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
        Khuyến nghị: Vui lòng kiểm tra lưu lượng truy cập (Traffic Rate), tài nguyên CPU/RAM hoặc các truy vấn Database chậm đang chiếm dụng Connection Pool.
      </p>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="{{TraceUrl}}" style="display: inline-block; background: #ea580c; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700;">
          📊 Xem Biểu đồ Phân bổ Độ trễ (Latency Distribution)
        </a>
      </div>
    </div>
    <div style="background: #0f172a; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
      SpurTrace APM Alerts · Giám sát hiệu năng hệ thống liên tục.
    </div>
  </div>
</body>
</html>`
  },
  {
    id: "tpl_deadlock",
    name: "Khóa Bảng & Deadlock CSDL (Database Deadlock)",
    category: "deadlock",
    subject: "[SpurTrace CRITICAL] Khóa bảng / Deadlock phát hiện tại {{ServiceName}}",
    description: "Cảnh báo khẩn cấp khi xảy ra tranh chấp khóa SQL Server hoặc Lock Timeout.",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #9333ea, #7e22ce); padding: 24px; color: #ffffff;">
      <div style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: rgba(0,0,0,0.3); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.2);">
        CRITICAL DATABASE DEADLOCK
      </div>
      <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 700; line-height: 1.3;">🔒 {{AlertTitle}}</h1>
      <p style="margin: 0; font-size: 13px; opacity: 0.9;">Phát hiện tranh chấp khóa tài nguyên CSDL (Lock Request Timeout / Victim Deadlock)</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1; margin-top: 0;">
        Hệ thống phát hiện tiến trình xử lý tại dịch vụ <strong style="color: #f8fafc;">{{ServiceName}}</strong> bị chặn bởi khóa bảng cơ sở dữ liệu:
      </p>
      <div style="background: #2e1065; border: 1px solid #a855f7; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #e9d5ff; margin-bottom: 6px;">Mô tả sự cố khóa:</div>
        <div style="font-family: monospace; font-size: 12px; color: #d8b4fe; line-height: 1.5;">Transaction (Process ID) was deadlocked on lock resources with another process and has been chosen as the deadlock victim.</div>
      </div>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="{{TraceUrl}}" style="display: inline-block; background: #9333ea; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700;">
          🔍 Kiểm tra Deadlock Graph trong SpurTrace
        </a>
      </div>
    </div>
    <div style="background: #0f172a; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
      SpurTrace APM Alerts · Bảo vệ toàn vẹn dữ liệu và thông lượng giao dịch.
    </div>
  </div>
</body>
</html>`
  },
  {
    id: "tpl_health",
    name: "Dịch Vụ Mất Kết Nối / Offline (Service Health)",
    category: "health",
    subject: "[SpurTrace CRITICAL] Dịch vụ {{ServiceName}} mất kết nối (Heartbeat Timeout)",
    description: "Cảnh báo khi dịch vụ ngưng gửi heartbeat hoặc container/process bị treo.",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #0284c7, #0369a1); padding: 24px; color: #ffffff;">
      <div style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: rgba(0,0,0,0.3); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.2);">
        HEARTBEAT ALERT
      </div>
      <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 700; line-height: 1.3;">📡 {{AlertTitle}}</h1>
      <p style="margin: 0; font-size: 13px; opacity: 0.9;">Dịch vụ <strong style="color: #fff;">{{ServiceName}}</strong> không phản hồi tín hiệu định kỳ</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1; margin-top: 0;">
        Hệ thống không nhận được tín hiệu Heartbeat từ máy chủ ứng dụng trong khoảng thời gian quy định (> {{ThresholdMs}} giây).
      </p>
      <div style="background: #082f49; border: 1px solid #38bdf8; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; color: #bae6fd;">
        Trạng thái hiện tại: <strong>OFFLINE / UNHEALTHY</strong><br>
        Thời gian mất tín hiệu: <strong>{{Timestamp}}</strong>
      </div>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="{{TraceUrl}}" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700;">
          🖥️ Kiểm tra System Health & Pods
        </a>
      </div>
    </div>
    <div style="background: #0f172a; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
      SpurTrace APM Alerts · Giám sát tính sẵn sàng dịch vụ (High Availability).
    </div>
  </div>
</body>
</html>`
  },
  {
    id: "tpl_custom",
    name: "Thông Báo Sự Cố Tùy Chỉnh (Custom Alert)",
    category: "custom",
    subject: "[SpurTrace {{Severity}}] Thông báo vận hành hệ thống: {{AlertTitle}}",
    description: "Mẫu thông báo sự cố tiêu chuẩn đa mục đích, phù hợp với mọi quy trình thông báo.",
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #334155, #1e293b); padding: 24px; color: #ffffff; border-bottom: 2px solid #38bdf8;">
      <div style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(56, 189, 248, 0.4);">
        {{Severity}} NOTIFICATION
      </div>
      <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 700; line-height: 1.3;">🔔 {{AlertTitle}}</h1>
      <p style="margin: 0; font-size: 13px; opacity: 0.9;">Thông báo giám sát tự động cho dịch vụ <strong>{{ServiceName}}</strong></p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1; margin-top: 0;">
        Chính sách cảnh báo <strong>{{AlertTitle}}</strong> vừa được kích hoạt. Thông tin sự cố như sau:
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0; background: #0f172a; border-radius: 8px; overflow: hidden; border: 1px solid #334155;">
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; width: 140px; font-weight: 600;">Dịch vụ:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-weight: 600;">{{ServiceName}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 600;">Mức độ:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #38bdf8; font-weight: 700;">{{Severity}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 600;">Thời gian kích hoạt:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8;">{{Timestamp}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #94a3b8; font-weight: 600;">Trace ID:</td>
          <td style="padding: 10px 14px; font-family: monospace; color: #38bdf8; word-break: break-all;">{{TraceId}}</td>
        </tr>
      </table>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="{{TraceUrl}}" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700;">
          Truy cập SpurTrace APM Dashboard
        </a>
      </div>
    </div>
    <div style="background: #0f172a; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
      SpurTrace APM Alerts · Senao EMS Production.
    </div>
  </div>
</body>
</html>`
  }
];

export const ALL_SERVICES = "All Services";
export const SERVICES = [ALL_SERVICES, "MES-API", "Order-Service", "Inventory-Worker"];
export const CHANNELS: AlertChannel[] = ["email", "inApp"];
export const SEVERITIES: AlertSeverity[] = ["critical", "warning", "info"];
export const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
export const FORM_METRICS: AlertMetric[] = [
  "p95_latency",
  "error_rate",
  "slow_sql",
  "n_plus_one",
  "5xx_count",
];
export const COOLDOWN_OPTIONS = [5, 15, 30, 60];

export const METRIC_UNITS: Record<AlertMetric, string> = {
  p95_latency: "ms",
  error_rate: "%",
  slow_sql: "ms",
  n_plus_one: "statements",
  "5xx_count": "exceptions",
  heartbeat_timeout: "secs",
};

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: "rule-1",
    name: "[CRITICAL] MES-API HTTP 500 & Unhandled Exceptions",
    nameKey: "alerts.seed.rule1",
    service: "MES-API",
    metric: "5xx_count",
    threshold: 1,
    unit: "exceptions",
    severity: "critical",
    channels: { email: true, inApp: true },
    cooldownMins: 15,
    enabled: true,
  },
  {
    id: "rule-2",
    name: "[WARNING] High Latency Spike P95 (> 500ms)",
    nameKey: "alerts.seed.rule2",
    service: ALL_SERVICES,
    metric: "p95_latency",
    threshold: 500,
    unit: "ms",
    severity: "warning",
    channels: { email: true, inApp: false },
    cooldownMins: 15,
    enabled: true,
  },
  {
    id: "rule-3",
    name: "[CRITICAL] Production Error Rate Spike (> 1.0%)",
    nameKey: "alerts.seed.rule3",
    service: ALL_SERVICES,
    metric: "error_rate",
    threshold: 1.0,
    unit: "%",
    severity: "critical",
    channels: { email: true, inApp: true },
    cooldownMins: 10,
    enabled: true,
  },
  {
    id: "rule-4",
    name: "[DB] CIM SSFDC Slow SQL Execution (> 300ms)",
    nameKey: "alerts.seed.rule4",
    service: ALL_SERVICES,
    metric: "slow_sql",
    threshold: 300,
    unit: "ms",
    severity: "warning",
    channels: { email: true, inApp: true },
    cooldownMins: 30,
    enabled: true,
  },
  {
    id: "rule-5",
    name: "[CODE] Database N+1 Query Loop (> 5 duplicates)",
    nameKey: "alerts.seed.rule5",
    service: ALL_SERVICES,
    metric: "n_plus_one",
    threshold: 5,
    unit: "statements",
    severity: "warning",
    channels: { email: false, inApp: true },
    cooldownMins: 30,
    enabled: true,
  },
];

export const SEED_INCIDENT_LOGS: IncidentLog[] = [
  {
    id: "inc-1",
    ruleName: DEFAULT_ALERT_RULES[0].name,
    ruleNameKey: DEFAULT_ALERT_RULES[0].nameKey,
    severity: "critical",
    minutesAgo: 10,
    channels: ["email"],
    details: { key: "alerts.log.seedException" },
  },
  {
    id: "inc-2",
    ruleName: DEFAULT_ALERT_RULES[3].name,
    ruleNameKey: DEFAULT_ALERT_RULES[3].nameKey,
    severity: "warning",
    minutesAgo: 60,
    channels: ["email"],
    details: { key: "alerts.log.seedSlowSql" },
  },
];

export function ruleLabel(t: TranslateFn, rule: Pick<AlertRule, "name" | "nameKey">) {
  return rule.nameKey ? t(rule.nameKey, rule.name) : rule.name;
}

export function logRuleLabel(t: TranslateFn, log: Pick<IncidentLog, "ruleName" | "ruleNameKey">) {
  return log.ruleNameKey ? t(log.ruleNameKey, log.ruleName) : log.ruleName;
}

export function serviceLabel(t: TranslateFn, service: string) {
  return service === ALL_SERVICES ? t("alerts.allServices") : service;
}

export function unitLabel(t: TranslateFn, unit: string) {
  return t(`alerts.unit.${unit}`, unit);
}

const UNITS_IMPLIED_BY_METRIC = new Set(["exceptions", "statements"]);

export function formatThreshold(t: TranslateFn, threshold: number, unit: string) {
  if (UNITS_IMPLIED_BY_METRIC.has(unit)) return String(threshold);
  if (unit === "%") return `${threshold}%`;
  return `${threshold} ${unitLabel(t, unit)}`;
}

export function conditionLabel(t: TranslateFn, rule: AlertRule) {
  return `${t(`alerts.metric.${rule.metric}`)} > ${formatThreshold(t, rule.threshold, rule.unit)}`;
}

export function formatAgo(t: TranslateFn, minutes: number) {
  if (isNaN(minutes) || minutes <= 0) return t("alerts.log.justNow");
  if (minutes < 60) return t("alerts.log.minutesAgo", { n: minutes });
  return t("alerts.log.hoursAgo", { n: Math.floor(minutes / 60) });
}

export function detailText(t: TranslateFn, detail: IncidentDetail) {
  return t(detail.key, {
    metric: detail.metric ? t(`alerts.metric.${detail.metric}`) : "",
    threshold: detail.threshold ?? "",
    unit: detail.unit ?? "",
  });
}

export function enabledChannels(channels: Record<AlertChannel, boolean>) {
  return CHANNELS.filter((channel) => channels[channel]);
}
