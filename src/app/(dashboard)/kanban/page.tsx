'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User as UserIcon, Zap } from 'lucide-react';
import Link from 'next/link';

type BugStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type Priority = 'P0' | 'P1' | 'P2' | 'P3';

interface BugItem {
  id: number;
  title: string;
  severity: Severity;
  priority: Priority;
  status: BugStatus;
  projectId: string;
  project: { name: string };
  component: { name: string };
  assignee: { id: string; name: string; avatar: string | null } | null;
}

const COLUMNS: { label: string; status: BugStatus; color: string }[] = [
  { label: 'New', status: 'NEW', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  { label: 'Triaged', status: 'TRIAGED', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
  { label: 'In Progress', status: 'IN_PROGRESS', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  { label: 'In Review', status: 'IN_REVIEW', color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
  { label: 'Resolved', status: 'RESOLVED', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  { label: 'Closed', status: 'CLOSED', color: 'bg-slate-500/10 border-slate-500/20 text-slate-400' },
];

const SEVERITY_BADGES = {
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const PRIORITY_BADGES = {
  P0: 'bg-red-500/10 text-red-400 border-red-550',
  P1: 'bg-orange-500/10 text-orange-400 border-orange-550',
  P2: 'bg-yellow-500/10 text-yellow-400 border-yellow-550',
  P3: 'bg-slate-500/10 text-slate-400 border-slate-550',
};

export default function KanbanPage() {
  const { data: session } = useSession();
  const [bugs, setBugs] = useState<BugItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchBugs = async () => {
    try {
      const res = await fetch('/api/bugs');
      if (res.ok) {
        const data = await res.json();
        setBugs(data);
      }
    } catch (err) {
      console.error('Error fetching bugs for Kanban:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, []);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
  };

  const handleDrop = async (e: React.DragEvent, destinationStatus: BugStatus) => {
    e.preventDefault();
    const bugIdStr = e.dataTransfer.getData('text/plain');
    if (!bugIdStr) return;

    const bugId = Number(bugIdStr);
    const targetBug = bugs.find((b) => b.id === bugId);

    if (!targetBug || targetBug.status === destinationStatus) return;

    // Optimistically update status
    setBugs((prev) =>
      prev.map((b) => (b.id === bugId ? { ...b, status: destinationStatus } : b))
    );
    setUpdatingId(bugId);

    try {
      const res = await fetch(`/api/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: destinationStatus,
          changedById: (session?.user as any)?.id,
        }),
      });

      if (!res.ok) {
        // Revert status on failure
        throw new Error('Failed to update status on server');
      }
    } catch (err) {
      console.error(err);
      // Refetch from server to revert state
      fetchBugs();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 font-mono">Assembling workflow board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-900 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kanban Issue Board</h1>
          <p className="text-xs text-slate-450 mt-1">
            Drag and drop issues across columns to transition status states.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400 font-mono">
          <Zap className="h-3.5 w-3.5 text-violet-400" />
          <span>Workflow Enforcement Enabled</span>
        </div>
      </div>

      {/* Board Layout Grid */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px] h-[calc(100vh-220px)]">
          {COLUMNS.map((col) => {
            const columnBugs = bugs.filter((b) => b.status === col.status);
            return (
              <div
                key={col.status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.status)}
                className="w-80 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col p-4 shrink-0"
              >
                {/* Column Title */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${col.color.split(' ')[2].replace('text-', 'bg-')}`}></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-350">{col.label}</span>
                  </div>
                  <span className="rounded bg-slate-900 border border-slate-850 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 font-mono">
                    {columnBugs.length}
                  </span>
                </div>

                {/* Bug Cards List container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {columnBugs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-28 border border-dashed border-slate-900/60 rounded-xl text-center text-slate-600 font-mono text-[10px] py-4">
                      <span>Empty Queue</span>
                      <span className="text-[9px] mt-1">Drag bugs here</span>
                    </div>
                  ) : (
                    columnBugs.map((bug) => (
                      <div
                        key={bug.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, bug.id)}
                        className={`rounded-xl border border-slate-900/80 bg-slate-900/40 p-4 transition-all hover:scale-[1.02] hover:border-slate-800 cursor-grab active:cursor-grabbing backdrop-blur-sm select-none relative ${
                          updatingId === bug.id ? 'opacity-50 ring-1 ring-violet-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-slate-500 font-mono font-bold">#{bug.id}</span>
                          <span className="text-[10px] text-slate-400 font-semibold bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-md truncate max-w-[120px]" title={bug.project.name}>
                            {bug.project.name}
                          </span>
                        </div>

                        <Link href={`/bugs/${bug.id}`} className="text-xs font-semibold text-slate-200 hover:text-violet-400 transition-colors line-clamp-2 leading-snug">
                          {bug.title}
                        </Link>
                        <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-slate-950">
                          {/* Badges */}
                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${SEVERITY_BADGES[bug.severity as keyof typeof SEVERITY_BADGES]}`}>
                              {bug.severity.substring(0, 4)}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${PRIORITY_BADGES[bug.priority as keyof typeof PRIORITY_BADGES]}`}>
                              {bug.priority}
                            </span>
                          </div>

                          {/* Assignee Avatar */}
                          {bug.assignee ? (
                            bug.assignee.avatar ? (
                              <img
                                src={bug.assignee.avatar}
                                alt={bug.assignee.name}
                                className="h-6 w-6 rounded-full bg-slate-800 border border-slate-950"
                                title={`Assigned to ${bug.assignee.name}`}
                              />
                            ) : (
                              <div
                                className="h-6 w-6 rounded-full bg-slate-850 flex items-center justify-center text-[10px] text-slate-350 border border-slate-950 font-bold uppercase"
                                title={`Assigned to ${bug.assignee.name}`}
                              >
                                {bug.assignee.name.charAt(0)}
                              </div>
                            )
                          ) : (
                            <div className="h-6 w-6 rounded-full border border-dashed border-slate-800 flex items-center justify-center text-slate-600" title="Unassigned">
                              <UserIcon className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
