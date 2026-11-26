"use client";

import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Activity, BarChart3, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

const chartConfig = {
  ok: {
    label: '200 OK (Thành công)',
    color: '#10b981', // Emerald
  },
  slow: {
    label: 'Slow (≥ 1s)',
    color: '#f59e0b', // Amber
  },
  error: {
    label: 'Error (Lỗi)',
    color: '#ef4444', // Red
  },
};

export function TraceTimelineChart({ traces = [], timeline = [], onSelectBucket }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'area' (default: 'bar')

  // Chuẩn hóa dữ liệu bucket
  const chartData = useMemo(() => {
    if (timeline && timeline.length > 0) {
      const mapped = timeline.map((b) => {
        const error = b.error ?? b.errors ?? 0;
        const total = b.total ?? b.count ?? 0;
        const slow = b.slow ?? 0;
        const ok = b.ok ?? Math.max(0, total - slow - error);
        return {
          time: b.time,
          ok,
          slow,
          error,
          total: total || (ok + slow + error),
          avgDuration: Math.round(b.avgDurationMs || b.avgDuration || 0),
        };
      });

      // Nếu timeline từ backend có dữ liệu (total > 0), ưu tiên dùng timeline
      const hasData = mapped.some((b) => b.total > 0 || b.ok > 0 || b.slow > 0 || b.error > 0);
      if (hasData) {
        return mapped;
      }
    }

    // Fallback: nếu timeline rỗng hoặc toàn 0, tự động gom nhóm trực tiếp từ danh sách traces
    if (!traces || traces.length === 0) return [];

    const bucketMap = new Map();

    traces.forEach((trace) => {
      const timeStr = trace.timestamp || trace.createdAt || (trace.events && trace.events[0]?.time);
      if (!timeStr) return;

      let d;
      try {
        d = new Date(timeStr);
        if (isNaN(d.getTime())) return;
      } catch {
        return;
      }

      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = Math.floor(d.getMinutes() / 5) * 5;
      const bucketKey = `${hours}:${String(minutes).padStart(2, '0')}`;

      if (!bucketMap.has(bucketKey)) {
        bucketMap.set(bucketKey, {
          time: bucketKey,
          ok: 0,
          slow: 0,
          error: 0,
          total: 0,
          totalDuration: 0,
        });
      }

      const item = bucketMap.get(bucketKey);
      item.total += 1;
      item.totalDuration += trace.totalDurationMs || trace.durationMs || trace.duration || 0;

      if (trace.hasError || trace.statusCode >= 400 || trace.state === 'error') {
        item.error += 1;
      } else if (
        trace.slowQueryCount > 0 ||
        (trace.totalDurationMs || trace.durationMs || trace.duration || 0) >= 1000 ||
        trace.state === 'slow'
      ) {
        item.slow += 1;
      } else {
        item.ok += 1;
      }
    });

    const sortedBuckets = Array.from(bucketMap.values()).sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    return sortedBuckets.map((b) => ({
      ...b,
      avgDuration: b.total > 0 ? Math.round(b.totalDuration / b.total) : 0,
    }));
  }, [traces, timeline]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    let total = 0;
    let ok = 0;
    let slow = 0;
    let error = 0;

    chartData.forEach((d) => {
      total += d.total;
      ok += d.ok;
      slow += d.slow;
      error += d.error;
    });

    const successRate = total > 0 ? (((ok + slow) / total) * 100).toFixed(1) : '100';
    return { total, ok, slow, error, successRate };
  }, [chartData]);

  if ((!traces || traces.length === 0) && (!timeline || timeline.length === 0)) return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#22252b] bg-white dark:bg-[#181b1f] shadow-sm overflow-hidden transition-all">
      <div className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#22252b]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-auto p-0 flex items-center gap-2 text-left group cursor-pointer focus:outline-none hover:bg-transparent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3274d9]/10 text-[#5794f2] group-hover:bg-[#3274d9]/20 transition-colors">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-800 dark:text-slate-100">
                <span>Logs Volume &amp; Activity Stream</span>
                {isCollapsed ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Traffic volume &amp; status breakdown over time &bull; Click bar to filter time
              </p>
            </div>
          </Button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#22252b] text-slate-700 dark:text-slate-300">
              <span className="text-[10px] text-slate-400 mr-1 uppercase">Total</span>
              <strong>{stats.total.toLocaleString()}</strong>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="text-[10px] opacity-75 mr-1 uppercase">Success</span>
              <strong>{stats.successRate}%</strong>
            </div>
            {stats.error > 0 && (
              <div className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
                <span className="text-[10px] opacity-75 mr-1 uppercase">Error</span>
                <strong>{stats.error}</strong>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-[#2b2e35] p-0.5 bg-slate-50 dark:bg-[#14161a]">
              <Button
                size="sm"
                variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                onClick={() => setChartType('bar')}
                className={`h-6 px-2 text-xs gap-1 rounded-md ${
                  chartType === 'bar'
                    ? 'bg-white dark:bg-[#22252b] shadow-xs font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                Bar
              </Button>
              <Button
                size="sm"
                variant={chartType === 'area' ? 'secondary' : 'ghost'}
                onClick={() => setChartType('area')}
                className={`h-6 px-2 text-xs gap-1 rounded-md ${
                  chartType === 'area'
                    ? 'bg-white dark:bg-[#22252b] shadow-xs font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="h-3 w-3" />
                Area
              </Button>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3.5 sm:px-5">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-46.25 sm:h-55 w-full cursor-pointer"
          >
            {chartType === 'area' ? (
              <AreaChart
                data={chartData}
                margin={{ left: -16, right: 8, top: 10, bottom: 0 }}
                className="cursor-pointer"
                onClick={(e) => {
                  if (e?.activePayload?.[0]?.payload && onSelectBucket) {
                    onSelectBucket(e.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  <linearGradient id="fillOk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillSlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillError" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />

                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />

                <ChartTooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8', cursor: 'pointer' }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(val, payload) => {
                        const row = payload?.[0]?.payload;
                        return (
                          <div className="flex items-center justify-between gap-4 pb-1 border-b border-border/50">
                            <span className="font-semibold text-cyan-500">Khung giờ: {val}</span>
                            <span className="text-[10px] text-muted-foreground">Độ trễ TB: {row?.avgDuration || 0}ms</span>
                          </div>
                        );
                      }}
                    />
                  }
                />

                <Area
                  dataKey="error"
                  type="monotone"
                  fill="url(#fillError)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  stackId="a"
                  cursor="pointer"
                  className="cursor-pointer"
                />
                <Area
                  dataKey="slow"
                  type="monotone"
                  fill="url(#fillSlow)"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  stackId="a"
                  cursor="pointer"
                  className="cursor-pointer"
                />
                <Area
                  dataKey="ok"
                  type="monotone"
                  fill="url(#fillOk)"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  stackId="a"
                  cursor="pointer"
                  className="cursor-pointer"
                />
              </AreaChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ left: -16, right: 8, top: 10, bottom: 0 }}
                className="cursor-pointer"
                onClick={(e) => {
                  if (e?.activePayload?.[0]?.payload && onSelectBucket) {
                    onSelectBucket(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />

                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />

                <ChartTooltip
                  cursor={{ fill: 'currentColor', opacity: 0.1, cursor: 'pointer' }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(val, payload) => {
                        const row = payload?.[0]?.payload;
                        return (
                          <div className="flex items-center justify-between gap-4 pb-1 border-b border-border/50">
                            <span className="font-semibold text-[#3274d9] dark:text-[#5794f2]">Khung giờ: {val}</span>
                            <span className="text-[10px] text-muted-foreground">Độ trễ TB: {row?.avgDuration || 0}ms</span>
                          </div>
                        );
                      }}
                    />
                  }
                />

                <Bar
                  dataKey="ok"
                  fill="#10b981"
                  stackId="a"
                  radius={[2, 2, 0, 0]}
                  cursor="pointer"
                  className="cursor-pointer"
                />
                <Bar
                  dataKey="slow"
                  fill="#f59e0b"
                  stackId="a"
                  radius={[2, 2, 0, 0]}
                  cursor="pointer"
                  className="cursor-pointer"
                />
                <Bar
                  dataKey="error"
                  fill="#ef4444"
                  stackId="a"
                  radius={[3, 3, 0, 0]}
                  cursor="pointer"
                  className="cursor-pointer"
                />
              </BarChart>
            )}
          </ChartContainer>

          <div className="flex items-center justify-center gap-5 mt-2 pt-2 border-t border-slate-200 dark:border-[#22252b] text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>200 OK ({stats.ok.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>Slow &ge; 1s ({stats.slow.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span>Error ({stats.error.toLocaleString()})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

TraceTimelineChart.propTypes = {
  traces: PropTypes.array,
  timeline: PropTypes.array,
  onSelectBucket: PropTypes.func,
};
