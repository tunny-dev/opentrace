// ==============================================================================================
// SpurTrace APM & Telemetry Integration for .NET 6 / 7 / 8 / 9 (ASP.NET Core Web API & .NET MVC)
// Universal Single-Table Contract: Compatible with Next.js, NestJS, Express, and .NET Fleet.
// ==============================================================================================

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Data.SqlClient;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace SpurTrace.AspNetCore
{
    // ==========================================================================================
    // 1. DATA MODELS (Matching universal `sys_traces` single-table schema)
    // ==========================================================================================
    public class TraceSpan
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("kind")]
        public string Kind { get; set; } = "app"; // "middleware", "db", "app", "http"

        [JsonPropertyName("startOffsetMs")]
        public double StartOffsetMs { get; set; }

        [JsonPropertyName("durationMs")]
        public double DurationMs { get; set; }
    }

    public class SqlCallRecord
    {
        [JsonPropertyName("fingerprint")]
        public string Fingerprint { get; set; } = string.Empty;

        [JsonPropertyName("query")]
        public string Query { get; set; } = string.Empty;

        [JsonPropertyName("durationMs")]
        public double DurationMs { get; set; }

        [JsonPropertyName("rows")]
        public int Rows { get; set; }

        [JsonPropertyName("isSlow")]
        public bool IsSlow { get; set; }

        [JsonPropertyName("duplicateCount")]
        public int DuplicateCount { get; set; } = 1;
    }

    public class TraceBreadcrumb
    {
        [JsonPropertyName("atMs")]
        public double AtMs { get; set; }

        [JsonPropertyName("category")]
        public string Category { get; set; } = "http"; // "http", "db", "exception", "system"

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("level")]
        public string Level { get; set; } = "info"; // "info", "warning", "error"
    }

    public class TraceExceptionInfo
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("signature")]
        public string Signature { get; set; } = string.Empty;
    }

    public class TraceRecord
    {
        [JsonPropertyName("traceId")]
        public string TraceId { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("appName")]
        public string AppName { get; set; } = "MES-Production";

        [JsonPropertyName("method")]
        public string Method { get; set; } = "GET";

        [JsonPropertyName("route")]
        public string Route { get; set; } = "/";

        [JsonPropertyName("statusCode")]
        public int StatusCode { get; set; } = 200;

        [JsonPropertyName("durationMs")]
        public double DurationMs { get; set; }

        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");

        [JsonPropertyName("sampleReason")]
        public string SampleReason { get; set; } = "sampled"; // "sampled", "slow", "error"

        [JsonPropertyName("exception")]
        public TraceExceptionInfo? Exception { get; set; }

        [JsonPropertyName("spans")]
        public List<TraceSpan> Spans { get; set; } = new();

        [JsonPropertyName("sqlCalls")]
        public List<SqlCallRecord> SqlCalls { get; set; } = new();

        [JsonPropertyName("breadcrumbs")]
        public List<TraceBreadcrumb> Breadcrumbs { get; set; } = new();
    }

    // ==========================================================================================
    // 2. TRACE CONTEXT (AsyncLocal for thread/task hierarchy inheritance)
    // ==========================================================================================
    public static class TraceContext
    {
        private static readonly AsyncLocal<TraceRecord?> _current = new();

        public static TraceRecord? Current
        {
            get => _current.Value;
            set => _current.Value = value;
        }

        public static Stopwatch? CurrentStopwatch { get; set; }
    }

    // ==========================================================================================
    // 3. CONFIGURATION OPTIONS
    // ==========================================================================================
    public enum SpurTraceStorageType
    {
        SqlServer,
        Sqlite,
        HttpEndpoint
    }

    public class SpurTraceOptions
    {
        public string AppName { get; set; } = "MES-Production";
        public SpurTraceStorageType StorageType { get; set; } = SpurTraceStorageType.SqlServer;
        public string ConnectionString { get; set; } = string.Empty;
        public string IngestionEndpoint { get; set; } = "http://localhost:3000/api/traces";
        public double SampleRateSuccess { get; set; } = 0.2; // 20% sample for fast 200 OK
        public double SlowRequestThresholdMs { get; set; } = 500;
        public double SlowQueryThresholdMs { get; set; } = 250;
        public int BatchSize { get; set; } = 100;
        public int FlushIntervalMs { get; set; } = 1500;
        public bool AutoCreateTables { get; set; } = true;
    }

    // ==========================================================================================
    // 4. AUTO DATABASE INITIALIZER (Creates `sys_traces` on Startup)
    // ==========================================================================================
    public class SpurTraceDbInitializer : IHostedService
    {
        private readonly SpurTraceOptions _options;

        public SpurTraceDbInitializer(SpurTraceOptions options)
        {
            _options = options;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            if (!_options.AutoCreateTables) return;

            try
            {
                if (_options.StorageType == SpurTraceStorageType.SqlServer && !string.IsNullOrWhiteSpace(_options.ConnectionString))
                {
                    await InitSqlServerAsync(cancellationToken);
                }
                else if (_options.StorageType == SpurTraceStorageType.Sqlite && !string.IsNullOrWhiteSpace(_options.ConnectionString))
                {
                    await InitSqliteAsync(cancellationToken);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SpurTrace] Warning: Auto-migration of table `sys_traces` failed: {ex.Message}");
            }
        }

        private async Task InitSqlServerAsync(CancellationToken ct)
        {
            const string sql = @"
            IF OBJECT_ID(N'dbo.sys_traces', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.sys_traces (
                    trace_id NVARCHAR(64) NOT NULL,
                    app_name NVARCHAR(160) NOT NULL,
                    method VARCHAR(12) NOT NULL,
                    route NVARCHAR(1024) NOT NULL,
                    status_code SMALLINT NOT NULL,
                    duration_ms FLOAT NOT NULL,
                    created_at DATETIME2(3) NOT NULL,
                    sample_reason VARCHAR(20) NOT NULL,
                    exception_json NVARCHAR(MAX) NULL,
                    spans_json NVARCHAR(MAX) NOT NULL DEFAULT N'[]',
                    sql_calls_json NVARCHAR(MAX) NOT NULL DEFAULT N'[]',
                    breadcrumbs_json NVARCHAR(MAX) NOT NULL DEFAULT N'[]',
                    CONSTRAINT pk_sys_traces PRIMARY KEY CLUSTERED (trace_id, created_at)
                );

                CREATE INDEX idx_sys_traces_created ON dbo.sys_traces (created_at DESC);
                CREATE INDEX idx_sys_traces_status ON dbo.sys_traces (status_code, created_at DESC);
                CREATE INDEX idx_sys_traces_duration ON dbo.sys_traces (duration_ms DESC);
                CREATE INDEX idx_sys_traces_app ON dbo.sys_traces (app_name, created_at DESC);
            END";

            using var conn = new SqlConnection(_options.ConnectionString);
            await conn.OpenAsync(ct);
            using var cmd = new SqlCommand(sql, conn);
            await cmd.ExecuteNonQueryAsync(ct);
            Console.WriteLine("[SpurTrace] Verified SQL Server table `dbo.sys_traces` successfully.");
        }

        private async Task InitSqliteAsync(CancellationToken ct)
        {
            const string sql = @"
            CREATE TABLE IF NOT EXISTS sys_traces (
                trace_id TEXT NOT NULL,
                app_name TEXT NOT NULL,
                method TEXT NOT NULL,
                route TEXT NOT NULL,
                status_code INTEGER NOT NULL,
                duration_ms REAL NOT NULL,
                created_at TEXT NOT NULL,
                sample_reason TEXT NOT NULL,
                exception_json TEXT,
                spans_json TEXT NOT NULL DEFAULT '[]',
                sql_calls_json TEXT NOT NULL DEFAULT '[]',
                breadcrumbs_json TEXT NOT NULL DEFAULT '[]',
                PRIMARY KEY (trace_id, created_at)
            );
            CREATE INDEX IF NOT EXISTS idx_sys_traces_created ON sys_traces (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_sys_traces_status ON sys_traces (status_code, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_sys_traces_duration ON sys_traces (duration_ms DESC);
            CREATE INDEX IF NOT EXISTS idx_sys_traces_app ON sys_traces (app_name, created_at DESC);";

            using var conn = new SqliteConnection(_options.ConnectionString);
            await conn.OpenAsync(ct);
            using var cmd = new SqliteCommand(sql, conn);
            await cmd.ExecuteNonQueryAsync(ct);
            Console.WriteLine("[SpurTrace] Verified SQLite table `sys_traces` successfully.");
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    // ==========================================================================================
    // 5. BACKGROUND BATCH WRITER (Non-blocking In-Memory Channel)
    // ==========================================================================================
    public class SpurTraceBatchWriter : BackgroundService
    {
        private readonly SpurTraceOptions _options;
        private readonly Channel<TraceRecord> _channel;
        private static readonly HttpClient _httpClient = new();

        public SpurTraceBatchWriter(SpurTraceOptions options)
        {
            _options = options;
            _channel = Channel.CreateBounded<TraceRecord>(new BoundedChannelOptions(10000)
            {
                FullMode = BoundedChannelFullMode.DropOldest
            });
        }

        public void Enqueue(TraceRecord trace)
        {
            // Tail Sampling: Always keep errors and slow requests; sample healthy fast requests
            if (trace.SampleReason == "error" || trace.SampleReason == "slow")
            {
                _channel.Writer.TryWrite(trace);
                return;
            }

            if (Random.Shared.NextDouble() <= _options.SampleRateSuccess)
            {
                _channel.Writer.TryWrite(trace);
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var batch = new List<TraceRecord>();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    while (batch.Count < _options.BatchSize && _channel.Reader.TryRead(out var item))
                    {
                        batch.Add(item);
                    }

                    if (batch.Count > 0)
                    {
                        await FlushBatchAsync(batch, stoppingToken);
                        batch.Clear();
                    }

                    await Task.Delay(_options.FlushIntervalMs, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[SpurTrace] Batch writer error: {ex.Message}");
                }
            }

            // Flush remaining traces on shutdown
            while (_channel.Reader.TryRead(out var remaining))
            {
                batch.Add(remaining);
            }
            if (batch.Count > 0)
            {
                await FlushBatchAsync(batch, CancellationToken.None);
            }
        }

        private async Task FlushBatchAsync(List<TraceRecord> batch, CancellationToken ct)
        {
            if (_options.StorageType == SpurTraceStorageType.SqlServer)
            {
                await FlushToSqlServerAsync(batch, ct);
            }
            else if (_options.StorageType == SpurTraceStorageType.Sqlite)
            {
                await FlushToSqliteAsync(batch, ct);
            }
            else if (_options.StorageType == SpurTraceStorageType.HttpEndpoint)
            {
                await FlushToHttpEndpointAsync(batch, ct);
            }
        }

        private async Task FlushToSqlServerAsync(List<TraceRecord> batch, CancellationToken ct)
        {
            const string insertSql = @"
            INSERT INTO dbo.sys_traces (
                trace_id, app_name, method, route, status_code, duration_ms, created_at,
                sample_reason, exception_json, spans_json, sql_calls_json, breadcrumbs_json
            ) VALUES (
                @trace_id, @app_name, @method, @route, @status_code, @duration_ms, @created_at,
                @sample_reason, @exception_json, @spans_json, @sql_calls_json, @breadcrumbs_json
            );";

            using var conn = new SqlConnection(_options.ConnectionString);
            await conn.OpenAsync(ct);
            using var tx = conn.BeginTransaction();

            foreach (var trace in batch)
            {
                using var cmd = new SqlCommand(insertSql, conn, tx);
                cmd.Parameters.AddWithValue("@trace_id", trace.TraceId);
                cmd.Parameters.AddWithValue("@app_name", trace.AppName);
                cmd.Parameters.AddWithValue("@method", trace.Method);
                cmd.Parameters.AddWithValue("@route", trace.Route);
                cmd.Parameters.AddWithValue("@status_code", trace.StatusCode);
                cmd.Parameters.AddWithValue("@duration_ms", trace.DurationMs);
                cmd.Parameters.AddWithValue("@created_at", DateTime.Parse(trace.CreatedAt));
                cmd.Parameters.AddWithValue("@sample_reason", trace.SampleReason);
                cmd.Parameters.AddWithValue("@exception_json", (object?)JsonSerializer.Serialize(trace.Exception) ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@spans_json", JsonSerializer.Serialize(trace.Spans));
                cmd.Parameters.AddWithValue("@sql_calls_json", JsonSerializer.Serialize(trace.SqlCalls));
                cmd.Parameters.AddWithValue("@breadcrumbs_json", JsonSerializer.Serialize(trace.Breadcrumbs));
                await cmd.ExecuteNonQueryAsync(ct);
            }

            await tx.CommitAsync(ct);
        }

        private async Task FlushToSqliteAsync(List<TraceRecord> batch, CancellationToken ct)
        {
            const string insertSql = @"
            INSERT OR REPLACE INTO sys_traces (
                trace_id, app_name, method, route, status_code, duration_ms, created_at,
                sample_reason, exception_json, spans_json, sql_calls_json, breadcrumbs_json
            ) VALUES (
                $trace_id, $app_name, $method, $route, $status_code, $duration_ms, $created_at,
                $sample_reason, $exception_json, $spans_json, $sql_calls_json, $breadcrumbs_json
            );";

            using var conn = new SqliteConnection(_options.ConnectionString);
            await conn.OpenAsync(ct);
            using var tx = conn.BeginTransaction();

            foreach (var trace in batch)
            {
                using var cmd = new SqliteCommand(insertSql, conn, tx);
                cmd.Parameters.AddWithValue("$trace_id", trace.TraceId);
                cmd.Parameters.AddWithValue("$app_name", trace.AppName);
                cmd.Parameters.AddWithValue("$method", trace.Method);
                cmd.Parameters.AddWithValue("$route", trace.Route);
                cmd.Parameters.AddWithValue("$status_code", trace.StatusCode);
                cmd.Parameters.AddWithValue("$duration_ms", trace.DurationMs);
                cmd.Parameters.AddWithValue("$created_at", trace.CreatedAt);
                cmd.Parameters.AddWithValue("$sample_reason", trace.SampleReason);
                cmd.Parameters.AddWithValue("$exception_json", (object?)JsonSerializer.Serialize(trace.Exception) ?? DBNull.Value);
                cmd.Parameters.AddWithValue("$spans_json", JsonSerializer.Serialize(trace.Spans));
                cmd.Parameters.AddWithValue("$sql_calls_json", JsonSerializer.Serialize(trace.SqlCalls));
                cmd.Parameters.AddWithValue("$breadcrumbs_json", JsonSerializer.Serialize(trace.Breadcrumbs));
                await cmd.ExecuteNonQueryAsync(ct);
            }

            await tx.CommitAsync(ct);
        }

        private async Task FlushToHttpEndpointAsync(List<TraceRecord> batch, CancellationToken ct)
        {
            var json = JsonSerializer.Serialize(batch);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            await _httpClient.PostAsync(_options.IngestionEndpoint, content, ct);
        }
    }

    // ==========================================================================================
    // 6. ASP.NET CORE HTTP MIDDLEWARE (Captures request waterfall, status, exception)
    // ==========================================================================================
    public class SpurTraceMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly SpurTraceBatchWriter _writer;
        private readonly SpurTraceOptions _options;

        public SpurTraceMiddleware(RequestDelegate next, SpurTraceBatchWriter writer, SpurTraceOptions options)
        {
            _next = next;
            _writer = writer;
            _options = options;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Ignore static assets and health check probes
            var path = context.Request.Path.Value ?? "/";
            if (path.StartsWith("/_telemetry") || path.StartsWith("/static") || path.EndsWith(".ico") || path.EndsWith(".js") || path.EndsWith(".css"))
            {
                await _next(context);
                return;
            }

            var stopwatch = Stopwatch.StartNew();
            var trace = new TraceRecord
            {
                TraceId = Guid.NewGuid().ToString(),
                AppName = _options.AppName,
                Method = context.Request.Method,
                Route = path,
                CreatedAt = DateTime.UtcNow.ToString("o")
            };

            TraceContext.Current = trace;
            trace.Breadcrumbs.Add(new TraceBreadcrumb
            {
                AtMs = 0,
                Category = "http",
                Message = $"Request started {trace.Method} {trace.Route}",
                Level = "info"
            });

            try
            {
                await _next(context);
                trace.StatusCode = context.Response.StatusCode;
            }
            catch (Exception ex)
            {
                trace.StatusCode = 500;
                trace.SampleReason = "error";
                trace.Exception = new TraceExceptionInfo
                {
                    Name = ex.GetType().Name,
                    Message = ex.Message,
                    Signature = $"{ex.GetType().Name}: {ex.Message}\n{ex.StackTrace}"
                };

                trace.Breadcrumbs.Add(new TraceBreadcrumb
                {
                    AtMs = stopwatch.ElapsedMilliseconds,
                    Category = "exception",
                    Message = $"{ex.GetType().Name}: {ex.Message}",
                    Level = "error"
                });

                throw;
            }
            finally
            {
                stopwatch.Stop();
                var duration = stopwatch.ElapsedMilliseconds;
                trace.DurationMs = duration;

                var isSlow = duration >= _options.SlowRequestThresholdMs;
                var isError = trace.StatusCode >= 400 || trace.Exception != null;
                trace.SampleReason = isError ? "error" : isSlow ? "slow" : "sampled";

                // Add synthetic middleware & app logic spans
                var totalSqlDuration = 0.0;
                foreach (var sql in trace.SqlCalls)
                {
                    totalSqlDuration += sql.DurationMs;
                }

                trace.Spans.Insert(0, new TraceSpan
                {
                    Name = $"{trace.Method} {trace.Route}",
                    Kind = "middleware",
                    StartOffsetMs = 0,
                    DurationMs = duration
                });

                trace.Spans.Add(new TraceSpan
                {
                    Name = "Application Logic",
                    Kind = "app",
                    StartOffsetMs = 0,
                    DurationMs = Math.Max(0, duration - totalSqlDuration)
                });

                trace.Breadcrumbs.Add(new TraceBreadcrumb
                {
                    AtMs = duration,
                    Category = "http",
                    Message = $"Response finished with {trace.StatusCode}",
                    Level = isError ? "error" : isSlow ? "warning" : "info"
                });

                // Hand off to non-blocking background queue
                _writer.Enqueue(trace);
                TraceContext.Current = null;
            }
        }
    }

    // ==========================================================================================
    // 7. EF CORE DB COMMAND INTERCEPTOR (Zero-code tracking of all queries)
    // ==========================================================================================
    public class SpurTraceDbInterceptor : DbCommandInterceptor
    {
        private static readonly Regex LiteralRegex = new(@"'(?:''|[^'])*'|\b\d+\b", RegexOptions.Compiled);
        private readonly double _slowQueryThresholdMs;

        public SpurTraceDbInterceptor(double slowQueryThresholdMs = 250)
        {
            _slowQueryThresholdMs = slowQueryThresholdMs;
        }

        private static string FingerprintSql(string sql)
        {
            if (string.IsNullOrWhiteSpace(sql)) return string.Empty;
            return LiteralRegex.Replace(sql, "?").Trim();
        }

        public override DbDataReader ReaderExecuted(DbCommand command, CommandExecutedEventData eventData, DbDataReader result)
        {
            RecordQuery(command, eventData.Duration.TotalMilliseconds, result.RecordsAffected);
            return base.ReaderExecuted(command, eventData, result);
        }

        public override async ValueTask<DbDataReader> ReaderExecutedAsync(DbCommand command, CommandExecutedEventData eventData, DbDataReader result, CancellationToken cancellationToken = default)
        {
            RecordQuery(command, eventData.Duration.TotalMilliseconds, result.RecordsAffected);
            return await base.ReaderExecutedAsync(command, eventData, result, cancellationToken);
        }

        public override int NonQueryExecuted(DbCommand command, CommandExecutedEventData eventData, int result)
        {
            RecordQuery(command, eventData.Duration.TotalMilliseconds, result);
            return base.NonQueryExecuted(command, eventData, result);
        }

        public override async ValueTask<int> NonQueryExecutedAsync(DbCommand command, CommandExecutedEventData eventData, int result, CancellationToken cancellationToken = default)
        {
            RecordQuery(command, eventData.Duration.TotalMilliseconds, result);
            return await base.NonQueryExecutedAsync(command, eventData, result, cancellationToken);
        }

        private void RecordQuery(DbCommand command, double durationMs, int rowsAffected)
        {
            var trace = TraceContext.Current;
            if (trace == null || trace.SqlCalls.Count >= 200) return;

            var rawSql = command.CommandText;
            var fingerprint = FingerprintSql(rawSql);
            var isSlow = durationMs >= _slowQueryThresholdMs;

            trace.SqlCalls.Add(new SqlCallRecord
            {
                Fingerprint = fingerprint,
                Query = rawSql,
                DurationMs = Math.Round(durationMs, 1),
                Rows = Math.Max(0, rowsAffected),
                IsSlow = isSlow,
                DuplicateCount = 1
            });

            trace.Spans.Add(new TraceSpan
            {
                Name = "SQL Query",
                Kind = "db",
                StartOffsetMs = 0,
                DurationMs = Math.Round(durationMs, 1)
            });

            trace.Breadcrumbs.Add(new TraceBreadcrumb
            {
                AtMs = 0,
                Category = "db",
                Message = isSlow ? $"Slow SQL ({durationMs:F1}ms) · {fingerprint}" : $"SQL · {fingerprint}",
                Level = isSlow ? "warning" : "info"
            });
        }
    }

    // ==========================================================================================
    // 8. EXTENSION METHODS FOR FLUID REGISTRATION (Program.cs / Startup.cs)
    // ==========================================================================================
    public static class SpurTraceExtensions
    {
        public static IServiceCollection AddSpurTrace(this IServiceCollection services, Action<SpurTraceOptions> configure)
        {
            var options = new SpurTraceOptions();
            configure(options);

            services.AddSingleton(options);
            services.AddSingleton<SpurTraceBatchWriter>();
            services.AddHostedService(sp => sp.GetRequiredService<SpurTraceBatchWriter>());

            if (options.AutoCreateTables)
            {
                services.AddHostedService<SpurTraceDbInitializer>();
            }

            return services;
        }

        public static IApplicationBuilder UseSpurTrace(this IApplicationBuilder app)
        {
            return app.UseMiddleware<SpurTraceMiddleware>();
        }

        /// <summary>
        /// Serves the prebuilt React Dashboard directly from wwwroot/telemetry (Like Swagger UI / Hangfire)
        /// Works on both ASP.NET Core Web API and .NET MVC!
        /// </summary>
        public static IEndpointRouteBuilder MapSpurTraceEndpoints(this IEndpointRouteBuilder endpoints)
        {
            // Endpoint providing raw telemetry to the dashboard
            endpoints.MapGet("/api/traces", async (HttpContext context, SpurTraceOptions options) =>
            {
                var limit = 200;
                if (int.TryParse(context.Request.Query["limit"], out var l)) limit = Math.Clamp(l, 1, 500);

                if (options.StorageType == SpurTraceStorageType.SqlServer)
                {
                    using var conn = new SqlConnection(options.ConnectionString);
                    await conn.OpenAsync();
                    using var cmd = new SqlCommand($"SELECT TOP ({limit}) * FROM dbo.sys_traces ORDER BY created_at DESC", conn);
                    using var reader = await cmd.ExecuteReaderAsync();

                    var traces = new List<object>();
                    while (await reader.ReadAsync())
                    {
                        traces.Add(new
                        {
                            id = reader["trace_id"].ToString(),
                            service = reader["app_name"].ToString(),
                            method = reader["method"].ToString(),
                            route = reader["route"].ToString(),
                            status = Convert.ToInt32(reader["status_code"]),
                            duration = Convert.ToDouble(reader["duration_ms"]),
                            createdAt = Convert.ToDateTime(reader["created_at"]).ToString("o"),
                            state = Convert.ToInt32(reader["status_code"]) >= 400 ? "error" : "success",
                            spans = JsonSerializer.Deserialize<object>(reader["spans_json"].ToString() ?? "[]"),
                            queries = JsonSerializer.Deserialize<object>(reader["sql_calls_json"].ToString() ?? "[]"),
                            exception = reader["exception_json"] != DBNull.Value ? JsonSerializer.Deserialize<object>(reader["exception_json"].ToString() ?? "{}") : null
                        });
                    }
                    return Results.Ok(new { traces, total = traces.Count });
                }

                return Results.Ok(new { traces = Array.Empty<object>(), total = 0 });
            });

            return endpoints;
        }
    }
}
