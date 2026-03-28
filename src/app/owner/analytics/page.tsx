"use client";

import { useState, useEffect } from "react";
import { format, parse } from "date-fns";

interface Analytics {
  totalGuests: number;
  returningGuests: number;
  newGuests: number;
  vipGuests: number;
  avgVisits: number;
  allergyProfiles: number;
  totalBookings: number;
  completedCount: number;
  noShowCount: number;
  totalCovers: number;
  coversByDay: Record<string, number>;
  bookingsByHour: Record<string, number>;
  walkInsByDayOfWeek: Record<string, number>;
  reservationsByDayOfWeek: Record<string, number>;
}

function BarChart({
  data,
  labelFormatter,
}: {
  data: Record<string, number>;
  labelFormatter?: (key: string) => string;
}) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex gap-1 h-32">
      {entries.map(([key, value]) => (
        <div key={key} className="flex-1 flex flex-col items-center h-full">
          <span className="font-mono text-[9px] text-[#888888] h-4 flex items-end justify-center">
            {value > 0 ? value : ""}
          </span>
          <div className="flex-1 w-full flex items-end">
            <div
              className="w-full bg-[#0D0D0D] rounded-t-[2px] min-h-[2px] transition-all"
              style={{ height: `${Math.max((value / max) * 100, 2)}%` }}
            />
          </div>
          <span className="font-mono text-[8px] text-[#888888] mt-1.5 truncate w-full text-center">
            {labelFormatter ? labelFormatter(key) : key}
          </span>
        </div>
      ))}
    </div>
  );
}

function StackedBarChart({
  series,
  labels,
}: {
  series: { name: string; data: Record<string, number>; color: string }[];
  labels?: string[];
}) {
  const keys = labels || Object.keys(series[0].data);
  const totals = keys.map((k) => series.reduce((sum, s) => sum + (s.data[k] || 0), 0));
  const max = Math.max(...totals, 1);

  return (
    <div>
      <div className="flex gap-1 h-32">
        {keys.map((key) => {
          const total = series.reduce((sum, s) => sum + (s.data[key] || 0), 0);
          return (
            <div key={key} className="flex-1 flex flex-col items-center h-full">
              <span className="font-mono text-[9px] text-[#888888] h-4 flex items-end justify-center">
                {total > 0 ? total : ""}
              </span>
              <div className="flex-1 w-full flex items-end">
                <div
                  className="w-full flex flex-col-reverse rounded-t-[2px] overflow-hidden min-h-[2px]"
                  style={{ height: `${Math.max((total / max) * 100, 2)}%` }}
                >
                  {series.map((s) => {
                    const val = s.data[key] || 0;
                    if (val === 0) return null;
                    return (
                      <div
                        key={s.name}
                        style={{
                          backgroundColor: s.color,
                          height: `${(val / total) * 100}%`,
                        }}
                        className="w-full min-h-[1px]"
                      />
                    );
                  })}
                </div>
              </div>
              <span className="font-mono text-[8px] text-[#888888] mt-1.5 truncate w-full text-center">
                {key}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-[2px] inline-block"
              style={{ backgroundColor: s.color }}
            />
            <span className="font-mono text-[9px] text-[#888888]">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const size = 120;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="shrink-0">
        {segments.map((seg) => {
          const pct = seg.value / total;
          const offset = cumulative;
          cumulative += pct;
          return (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${pct * circumference} ${circumference}`}
              strokeDashoffset={-offset * circumference}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-[2px] inline-block"
              style={{ backgroundColor: seg.color }}
            />
            <span className="font-mono text-[11px] text-[#888888]">
              {seg.label}: {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(console.error);
  }, []);

  if (!analytics) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-sm text-[#888888]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-mono text-2xl font-bold uppercase tracking-[2px] mb-1">
        Analytics
      </h1>
      <p className="font-serif text-base italic mb-6">
        Insights across every booking and guest.
      </p>
      <hr className="border-[#E0E0E0] mb-8" />

      {/* Key Stats */}
      <div className="border border-[#E0E0E0] rounded-none grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-[#E0E0E0] mb-8">
        {[
          { value: analytics.totalBookings, label: "Total Bookings" },
          { value: analytics.totalCovers, label: "Total Covers" },
          { value: analytics.totalGuests, label: "Guests" },
          { value: analytics.returningGuests, label: "Returning" },
          { value: analytics.avgVisits, label: "Avg Visits" },
          { value: analytics.noShowCount, label: "No Shows" },
        ].map((stat) => (
          <div key={stat.label} className="py-5 px-4 text-center">
            <p className="font-mono text-2xl font-bold">{stat.value}</p>
            <p className="font-mono text-[9px] uppercase tracking-[1px] text-[#888888] mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Guests Per Day */}
        <div className="border border-[#E0E0E0] rounded-none p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
            Guests Per Day (Last 14 Days)
          </h3>
          <BarChart
            data={analytics.coversByDay}
            labelFormatter={(key) => {
              const d = parse(key, "yyyy-MM-dd", new Date());
              return format(d, "M/d");
            }}
          />
        </div>

        {/* New vs Returning */}
        <div className="border border-[#E0E0E0] rounded-none p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
            New vs Returning Guests
          </h3>
          <div className="flex items-center justify-center py-2">
            <DonutChart
              segments={[
                { label: "New", value: analytics.newGuests, color: "#0D0D0D" },
                { label: "Returning (2-9)", value: analytics.returningGuests, color: "#888888" },
                { label: "VIP (10+)", value: analytics.vipGuests, color: "#C45C4A" },
              ]}
            />
          </div>
        </div>

        {/* Busiest Times */}
        <div className="border border-[#E0E0E0] rounded-none p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
            Busiest Hours (Last 30 Days)
          </h3>
          <BarChart
            data={analytics.bookingsByHour}
            labelFormatter={(key) => {
              const h = parseInt(key);
              const ampm = h >= 12 ? "p" : "a";
              const h12 = h % 12 || 12;
              return `${h12}${ampm}`;
            }}
          />
        </div>

        {/* Busiest Days */}
        <div className="border border-[#E0E0E0] rounded-none p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
            Bookings by Day of Week
          </h3>
          <StackedBarChart
            series={[
              { name: "Reservations", data: analytics.reservationsByDayOfWeek, color: "#0D0D0D" },
              { name: "Walk-ins", data: analytics.walkInsByDayOfWeek, color: "#C45C4A" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
