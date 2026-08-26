'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Bookmark, User as UserIcon, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const BUG_STATUSES = ['NEW', 'TRIAGED', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'CLOSED', 'REOPENED'];
const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'];

type BugStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type Priority = 'P0' | 'P1' | 'P2' | 'P3';

interface BugItem {
  id: number;
  title: string;
  severity: Severity;
  priority: Priority;
  status: BugStatus;
  createdAt: string;
  dueDate: string | null;
  project: { id: string; name: string };
  component: { id: string; name: string };
  reporter: { name: string };
  assignee: { id: string; name: string; avatar: string | null } | null;
}

interface FilterOptions {
  projects: { id: string; name: string; components: { id: string; name: string }[] }[];
  users: { id: string; name: string; role: string }[];
}

export default function BugsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [bugs, setBugs] = useState<BugItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<FilterOptions | null>(null);

  // Active filters state
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [textQuery, setTextQuery] = useState('');

  // Fetch filter dropdown options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setOptions(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch bugs when filters or URL query params change
  const fetchBugs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProject) params.set('projectId', selectedProject);
      if (selectedComponent) params.set('componentId', selectedComponent);
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedSeverity) params.set('severity', selectedSeverity);
      if (selectedPriority) params.set('priority', selectedPriority);
      if (selectedAssignee) params.set('assigneeId', selectedAssignee);
      if (textQuery) params.set('q', textQuery);

      const res = await fetch(`/api/bugs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBugs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sync state with URL params (e.g. from NL search redirect)
  useEffect(() => {
    const proj = searchParams.get('projectId') || '';
    const comp = searchParams.get('componentId') || '';
    const stat = searchParams.get('status') || '';
    const sev = searchParams.get('severity') || '';
    const prio = searchParams.get('priority') || '';
    const ass = searchParams.get('assigneeId') || '';
    const q = searchParams.get('q') || '';

    setSelectedProject(proj);
    setSelectedComponent(comp);
    setSelectedStatus(stat);
    setSelectedSeverity(sev);
    setSelectedPriority(prio);
    setSelectedAssignee(ass);
    setTextQuery(q);
  }, [searchParams]);

  // Trigger fetch when local state filters change
  useEffect(() => {
    fetchBugs();
  }, [selectedProject, selectedComponent, selectedStatus, selectedSeverity, selectedPriority, selectedAssignee]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBugs();
  };

  const handleResetFilters = () => {
    setSelectedProject('');
    setSelectedComponent('');
    setSelectedStatus('');
    setSelectedSeverity('');
    setSelectedPriority('');
    setSelectedAssignee('');
    setTextQuery('');
    router.push('/bugs'); // Clear URL params
  };

  // Preset Filters (Saved Searches)
  const applyPreset = (presetType: string) => {
    handleResetFilters();
    if (presetType === 'my-assigned' && session?.user) {
      setSelectedAssignee((session.user as any).id);
    } else if (presetType === 'critical') {
      setSelectedSeverity('CRITICAL');
    } else if (presetType === 'unassigned') {
      setSelectedAssignee('null');
    } else if (presetType === 'open') {
      setSelectedStatus('NEW');
    }
  };

  const selectedProjectDetails = options?.projects.find((p) => p.id === selectedProject);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-900">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Issue Explorer</h1>
          <p className="text-xs text-slate-450 mt-1">
            Search, filter, and drill down into active software reports.
          </p>
        </div>
        <button
          onClick={handleResetFilters}
          className="flex items-center gap-1.5 rounded-lg border border-slate-850 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-400 font-semibold hover:bg-slate-900 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Left Side: Preset Shortcuts */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3 font-mono">
              Quick Filter Presets
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => applyPreset('my-assigned')}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-350 hover:bg-slate-900/60 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="h-3.5 w-3.5 text-violet-400" />
                  Assigned to Me
                </span>
              </button>
              <button
                onClick={() => applyPreset('critical')}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-350 hover:bg-slate-900/60 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="h-3.5 w-3.5 text-red-400" />
                  Critical Bugs
                </span>
              </button>
              <button
                onClick={() => applyPreset('unassigned')}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-350 hover:bg-slate-900/60 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="h-3.5 w-3.5 text-amber-400" />
                  Unassigned Queue
                </span>
              </button>
              <button
                onClick={() => applyPreset('open')}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-350 hover:bg-slate-900/60 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="h-3.5 w-3.5 text-blue-400" />
                  New Submissions
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Main filters & list */}
        <div className="space-y-4 lg:col-span-3">
          {/* Filters Form */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Filter by keyword in title/description..."
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 py-1.5 pl-10 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-1.5 text-xs text-slate-200 font-semibold hover:bg-slate-800 transition-colors"
              >
                Find
              </button>
            </form>

            {/* Dropdown filters grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {/* Project */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setSelectedComponent(''); // Reset component
                  }}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  <option value="">All Projects</option>
                  {options?.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Component */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Component
                </label>
                <select
                  value={selectedComponent}
                  onChange={(e) => setSelectedComponent(e.target.value)}
                  disabled={!selectedProjectDetails}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-violet-500 disabled:opacity-40"
                >
                  <option value="">All Components</option>
                  {selectedProjectDetails?.components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  <option value="">All Statuses</option>
                  {BUG_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Severity
                </label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  <option value="">All Severities</option>
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  <option value="">All Priorities</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Assignee
                </label>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  <option value="">All Assignees</option>
                  <option value="null">Unassigned</option>
                  {options?.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bugs Table List */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md overflow-hidden">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"></div>
              </div>
            ) : bugs.length === 0 ? (
              <div className="text-center py-16 text-slate-550 font-mono text-xs">
                No bugs matching selected criteria found in workspace index.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="border-b border-slate-900 bg-slate-950/40 select-none text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    <tr>
                      <th className="p-3.5 pl-5">ID</th>
                      <th className="p-3.5">Title</th>
                      <th className="p-3.5">Project / Component</th>
                      <th className="p-3.5">Workflow</th>
                      <th className="p-3.5">Severity</th>
                      <th className="p-3.5">Assignee</th>
                      <th className="p-3.5 pr-5">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {bugs.map((bug) => (
                      <tr key={bug.id} className="hover:bg-slate-900/25 transition-colors group">
                        <td className="p-3.5 pl-5 font-mono text-slate-500 font-bold group-hover:text-violet-400 transition-colors">
                          #{bug.id}
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <Link
                            href={`/bugs/${bug.id}`}
                            className="font-semibold text-slate-200 hover:underline hover:text-violet-400 block truncate"
                          >
                            {bug.title}
                          </Link>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-300 truncate max-w-[150px]">{bug.project.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{bug.component.name}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="rounded bg-slate-900 border border-slate-850 px-2 py-0.5 text-[10px] font-semibold text-slate-350 uppercase tracking-wide">
                            {bug.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-[10px] uppercase font-mono">
                            {bug.severity}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {bug.assignee ? (
                            <div className="flex items-center gap-2">
                              {bug.assignee.avatar ? (
                                <img
                                  src={bug.assignee.avatar}
                                  alt={bug.assignee.name}
                                  className="h-5.5 w-5.5 rounded-full bg-slate-800 ring-1 ring-slate-950"
                                />
                              ) : (
                                <div className="h-5.5 w-5.5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                  {bug.assignee.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-slate-300 font-medium truncate max-w-[90px]" title={bug.assignee.name}>
                                {bug.assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600 font-mono font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3.5 pr-5 font-mono text-[10px] text-slate-500">
                          {bug.dueDate ? new Date(bug.dueDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
