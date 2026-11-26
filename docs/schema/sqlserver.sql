-- ==============================================================================
-- SpurTrace APM - SQL Server Schema & DDL Initialization Script
-- Schema: spurtrace
-- Compatible with: SQL Server 2016+, Azure SQL Database
-- Use this script when AutoCreateTables = false (e.g. strict production DBA policy)
-- ==============================================================================

-- 1. Ensure Schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'spurtrace')
BEGIN
    EXEC('CREATE SCHEMA spurtrace AUTHORIZATION dbo;');
END
GO

-- 2. Traces Table (trace_id FIRST column, audit columns included)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.traces') AND type in (N'U'))
BEGIN
    CREATE TABLE spurtrace.traces (
        trace_id NVARCHAR(64) NOT NULL PRIMARY KEY,
        app_name NVARCHAR(100) NOT NULL,
        method NVARCHAR(16) NOT NULL,
        route NVARCHAR(500) NOT NULL,
        status_code INT NOT NULL,
        duration_ms FLOAT NOT NULL,
        sample_reason NVARCHAR(32) NOT NULL,
        exception_json NVARCHAR(MAX) NULL,
        spans_json NVARCHAR(MAX) NOT NULL,
        sql_calls_json NVARCHAR(MAX) NOT NULL,
        breadcrumbs_json NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NULL,
        created_by NVARCHAR(100) NULL DEFAULT 'System',
        updated_by NVARCHAR(100) NULL
    );

    CREATE INDEX IX_spurtrace_traces_created_at ON spurtrace.traces(created_at DESC);
    CREATE INDEX IX_spurtrace_traces_route ON spurtrace.traces(route);
    CREATE INDEX IX_spurtrace_traces_status ON spurtrace.traces(status_code);
END
GO

-- 3. Users Table (Authentication & RBAC with audit columns)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.users') AND type in (N'U'))
BEGIN
    CREATE TABLE spurtrace.users (
        id NVARCHAR(64) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        password_hash NVARCHAR(256) NOT NULL,
        password_salt NVARCHAR(128) NOT NULL,
        display_name NVARCHAR(150) NOT NULL,
        email NVARCHAR(150) NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'Admin',
        is_active BIT NOT NULL DEFAULT 1,
        last_login_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NULL,
        created_by NVARCHAR(100) NULL DEFAULT 'System',
        updated_by NVARCHAR(100) NULL
    );
END
GO

-- 4. Settings Table (Dynamic operational settings with audit columns)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.settings') AND type in (N'U'))
BEGIN
    CREATE TABLE spurtrace.settings (
        [key] NVARCHAR(100) PRIMARY KEY,
        [value] NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        created_by NVARCHAR(100) NULL DEFAULT 'System',
        updated_by NVARCHAR(100) NULL
    );

    -- Seed Default Settings (Email SMTP only, Teams removed)
    INSERT INTO spurtrace.settings ([key], [value], created_by) VALUES
        ('slow_query_threshold_ms', '250', 'System'),
        ('slow_request_threshold_ms', '500', 'System'),
        ('sample_rate_success', '0.20', 'System'),
        ('enable_retention_cleanup', 'true', 'System'),
        ('retention_days', '30', 'System'),
        ('backup_enabled', 'true', 'System'),
        ('backup_schedule', 'daily', 'System'),
        ('backup_path', 'D:\Senao\Backups\SpurTrace', 'System'),
        ('smtp_host', 'smtp.office365.com', 'System'),
        ('smtp_port', '587', 'System'),
        ('smtp_user', 'spurtrace-alert@senao.com', 'System'),
        ('smtp_pass', '', 'System'),
        ('smtp_enable_ssl', 'true', 'System'),
        ('smtp_from_name', 'SpurTrace APM Alerts', 'System'),
        ('alert_email_to', 'admin@senao.com', 'System'),
        ('alert_min_severity', 'warning', 'System'),
        ('email_template_default', 'Alert_Critical', 'System');
END
GO

-- 5. Alert Rules Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.alert_rules') AND type in (N'U'))
BEGIN
    CREATE TABLE spurtrace.alert_rules (
        id NVARCHAR(64) PRIMARY KEY,
        name NVARCHAR(150) NOT NULL,
        metric NVARCHAR(64) NOT NULL,
        threshold FLOAT NOT NULL,
        unit NVARCHAR(32) NOT NULL,
        window_minutes INT NOT NULL DEFAULT 5,
        severity NVARCHAR(32) NOT NULL DEFAULT 'warning',
        channels NVARCHAR(256) NOT NULL DEFAULT 'email,inApp',
        is_enabled BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NULL,
        created_by NVARCHAR(100) NULL DEFAULT 'System',
        updated_by NVARCHAR(100) NULL
    );
END
GO

-- 6. Alert History Table (trace_id near top, audit columns included)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.alert_history') AND type in (N'U'))
BEGIN
    CREATE TABLE spurtrace.alert_history (
        id NVARCHAR(64) PRIMARY KEY,
        trace_id NVARCHAR(64) NULL,
        rule_id NVARCHAR(64) NULL,
        rule_name NVARCHAR(150) NOT NULL,
        severity NVARCHAR(32) NOT NULL DEFAULT 'warning',
        message NVARCHAR(MAX) NOT NULL,
        metric NVARCHAR(64) NULL,
        value NVARCHAR(64) NULL,
        channel NVARCHAR(64) NOT NULL DEFAULT 'Email',
        details NVARCHAR(MAX) NULL,
        triggered_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        status NVARCHAR(32) NOT NULL DEFAULT 'active',
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NULL,
        created_by NVARCHAR(100) NULL DEFAULT 'System',
        updated_by NVARCHAR(100) NULL
    );

    CREATE INDEX IX_spurtrace_alert_history_triggered_at ON spurtrace.alert_history(triggered_at DESC);
    CREATE INDEX IX_spurtrace_alert_history_trace_id ON spurtrace.alert_history(trace_id);
END
GO

-- 7. Email Templates Table (Mẫu email cảnh báo linh hoạt)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'spurtrace.email_templates') AND type in (N'U'))
BEGIN
    CREATE TABLE spurtrace.email_templates (
        id NVARCHAR(64) PRIMARY KEY,
        name NVARCHAR(150) NOT NULL,
        subject NVARCHAR(255) NOT NULL,
        body_html NVARCHAR(MAX) NOT NULL,
        is_default BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NULL,
        created_by NVARCHAR(100) NULL DEFAULT 'System',
        updated_by NVARCHAR(100) NULL
    );
END
GO
