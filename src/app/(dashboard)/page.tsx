'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Inbox,
  Flame,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  bug: { id: number; title: string };
  changedBy: { name: string; avatar: string | null };
}

interface DashboardStats {
  metrics: {
    open: number;
    critical: number;
    resolvedThisWeek: number;
    overdue: number;
  };
  statusDistribution: Array<{ name: string; value: number }>;
  severityDistribution: Array<{ name: string; value: number }>;
  recentActivity: ActivityItem[];
}

const COLORS = {
  CRITICAL: '#ef4444', // Red
  HIGH: '#f97316',     // Orange
  MEDIUM: '#eab308',   // Yellow
  LOW: '#3b82f6',      // Blue
};

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 font-mono">Compiling dashboard telemetry...</p>
        </div>
      </div>
    );
  }

  const { metrics, statusDistribution, severityDistribution, recentActivity } = stats;

  const cardData = [
    {
      title: 'Active Open Bugs',
      value: metrics.open,
      icon: Inbox,
      color: 'text-violet-400 border-violet-500/10 bg-violet-500/5',
    },
    {
      title: 'Critical Outages',
      value: metrics.critical,
      icon: Flame,
      color: 'text-red-400 border-red-500/10 bg-red-500/5',
    },
    {
      title: 'Resolved This Week',
      value: metrics.resolvedThisWeek,
      icon: CheckCircle2,
      color: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5',
    },
    {
      title: 'Overdue SLA',
      value: metrics.overdue,
      icon: Clock,
      color: 'text-amber-400 border-amber-500/10 bg-amber-500/5',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-900">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workspace Dashboard</h1>
          <p className="text-xs text-slate-450 mt-1 font-mono">
            Welcome back, <span className="text-violet-450 font-bold">{session?.user?.name}</span>. Review recent activities and reports below.
          </p>
        </div>
        <Link
          href="/bugs/new"
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-violet-500 transition-colors"
        >
          <Activity className="h-4 w-4" />
          <span>Report New Bug</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`rounded-xl border p-5 backdrop-blur-md flex items-center justify-between transition-all hover:scale-[1.01] hover:border-slate-800 ${card.color}`}
            >
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{card.title}</span>
                <p className="text-3xl font-extrabold text-white tracking-tight leading-none">{card.value}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-900">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Stats Graphs Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status Distribution */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 lg:col-span-2 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-450">Bugs Status Distribution</span>
            <span className="flex items-center gap-1 text-[10px] text-violet-400 font-semibold bg-violet-500/5 px-2 py-0.5 rounded border border-violet-500/10">
              <TrendingUp className="h-3 w-3" />
              Live Stats
            </span>
          </div>
          <div className="h-64">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#a78bfa', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#4f46e5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-6">Severity Matrix</span>
          <div className="h-64 flex items-center justify-center">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {severityDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.name as keyof typeof COLORS] || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    formatter={(value) => <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Lower Row: Recent Activity Log */}
      <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Audit & Activity Logs</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono">Refreshed real-time</span>
        </div>

        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-mono">
              No recent activity registered in current log session.
            </div>
          ) : (
            recentActivity.map((log) => (
              <div key={log.id} className="flex items-start justify-between text-xs py-1 border-b border-slate-900/40 last:border-0 pb-3 last:pb-0">
                <div className="flex items-start gap-3">
                  {log.changedBy.avatar ? (
                    <img
                      src={log.changedBy.avatar}
                      alt={log.changedBy.name}
                      className="h-7 w-7 rounded-full bg-slate-800 ring-1 ring-slate-850 mt-0.5"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-semibold mt-0.5">
                      {log.changedBy.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-slate-200">
                      <span className="font-semibold text-white">{log.changedBy.name}</span>{' '}
                      changed <span className="font-mono text-violet-400 font-semibold">{log.field}</span>{' '}
                      {log.field === 'creation' ? (
                        <span>({log.newValue})</span>
                      ) : (
                        <span>
                          from <span className="text-slate-400 line-through">"{log.oldValue || 'none'}"</span> to{' '}
                          <span className="text-emerald-400 font-semibold">"{log.newValue || 'none'}"</span>
                        </span>
                      )}
                    </p>
                    <Link
                      href={`/bugs/${log.bug.id}`}
                      className="text-[10px] text-slate-500 hover:text-violet-400 transition-colors font-mono mt-0.5 flex items-center gap-1"
                    >
                      Bug #{log.bug.id}: {log.bug.title}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
