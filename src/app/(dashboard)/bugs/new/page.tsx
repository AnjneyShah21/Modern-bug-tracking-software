'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  Send,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type Priority = 'P0' | 'P1' | 'P2' | 'P3';

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3'];

interface ProjectOption {
  id: string;
  name: string;
  components: { id: string; name: string }[];
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

interface DuplicateResult {
  bugId: number;
  title: string;
  similarityScore: number;
  reason: string;
}

export default function NewBugPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Load options
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [existingBugs, setExistingBugs] = useState<{ id: number; title: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [projectId, setProjectId] = useState('');
  const [componentId, setComponentId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [priority, setPriority] = useState<Priority>('P2');
  const [tagsInput, setTagsInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Relations
  const [blockedByIds, setBlockedByIds] = useState<string[]>([]);
  const [blockingIds, setBlockingIds] = useState<string[]>([]);

  // AI & Formatting State
  const [rawLog, setRawLog] = useState('');
  const [formattingRaw, setFormattingRaw] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [triageSuggestions, setTriageSuggestions] = useState<any>(null);

  // Duplicate Check State
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, bugRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/bugs'),
        ]);

        if (projRes.ok) {
          const data = await projRes.json();
          setProjects(data.projects);
          setUsers(data.users);
          if (data.projects.length > 0) {
            setProjectId(data.projects[0].id);
          }
        }

        if (bugRes.ok) {
          const data = await bugRes.json();
          setExistingBugs(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchData();
  }, []);

  // Set default component when project changes
  useEffect(() => {
    if (projectId) {
      const proj = projects.find((p) => p.id === projectId);
      if (proj && proj.components.length > 0) {
        setComponentId(proj.components[0].id);
      } else {
        setComponentId('');
      }
    }
  }, [projectId, projects]);

  // AI Duplicate Detection: Debounced checks on title + description changes
  useEffect(() => {
    if (!title || !projectId) {
      setDuplicates([]);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const res = await fetch('/api/ai/duplicate-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, projectId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.potentialDuplicates) {
            // Filter out matches with low similarity (under 40%)
            setDuplicates(data.potentialDuplicates.filter((d: any) => d.similarityScore >= 40));
          } else {
            setDuplicates([]);
          }
        }
      } catch (err) {
        console.error('Duplicate detection fetch error:', err);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 1500); // 1.5 second debounce

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [title, description, projectId]);

  // AI raw trace formatter
  const handleFormatRaw = async () => {
    if (!rawLog.trim()) return;
    setFormattingRaw(true);
    try {
      const res = await fetch('/api/ai/format-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: rawLog }),
      });

      if (res.ok) {
        const formatted = await res.json();
        setStepsToReproduce(formatted.stepsToReproduce || '');
        setExpectedBehavior(formatted.expectedBehavior || '');
        setActualBehavior(formatted.actualBehavior || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormattingRaw(false);
    }
  };

  // AI triage call
  const handleTriggerTriage = async () => {
    if (!title || !description || !projectId) {
      setError('Please provide at least a Title, Description, and Project first to run AI triage.');
      return;
    }
    setError(null);
    setTriaging(true);
    setTriageSuggestions(null);

    try {
      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, projectId }),
      });

      if (res.ok) {
        const suggestions = await res.json();
        setTriageSuggestions(suggestions);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to analyze bug triage values.');
      }
    } catch (err) {
      console.error(err);
      setError('AI service failed to respond.');
    } finally {
      setTriaging(false);
    }
  };

  const handleApplyTriage = () => {
    if (!triageSuggestions) return;

    if (triageSuggestions.severity) setSeverity(triageSuggestions.severity);
    if (triageSuggestions.priority) setPriority(triageSuggestions.priority);
    if (triageSuggestions.suggestedComponentId) setComponentId(triageSuggestions.suggestedComponentId);
    if (triageSuggestions.suggestedAssigneeId) setAssigneeId(triageSuggestions.suggestedAssigneeId);

    setTriageSuggestions(null); // Clear suggestions panel
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !projectId || !componentId) {
      setError('Please fill in all required fields (marked *).');
      return;
    }

    setSubmitting(true);
    setError(null);

    const tags = tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0);

    const bugPayload = {
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      priority,
      status: 'NEW',
      projectId,
      componentId,
      reporterId: (session?.user as any)?.id,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      tags,
      blockedByIds: blockedByIds.map(Number),
      blockingIds: blockingIds.map(Number),
    };

    try {
      const res = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bugPayload),
      });

      if (res.ok) {
        const newBug = await res.json();
        router.push(`/bugs/${newBug.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit bug report');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProj = projects.find((p) => p.id === projectId);

  if (loadingOptions) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 font-mono">Loading dynamic layout schemas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-900">
        <h1 className="text-2xl font-bold text-white tracking-tight">File a Bug Report</h1>
        <p className="text-xs text-slate-450 mt-1">
          Report a new issue, use AI formatting to extract traces, or leverage AI triage assistance.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/5 p-4 text-xs text-red-400">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Main Form Fields Container (Left 2 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-900">
              Basic Metadata
            </span>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-350 mb-1">
                Bug Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Memory leak during video export on Android 12"
                className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-550 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-350 mb-1">
                Description / Problem Summary <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred, context, and configurations..."
                className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-550 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              />
            </div>

            {/* Project & Component */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">
                  Project <span className="text-red-400">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">
                  Component <span className="text-red-400">*</span>
                </label>
                <select
                  value={componentId}
                  onChange={(e) => setComponentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  {selectedProj?.components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee & Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Choose Assignee (Unassigned)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
            </div>

            {/* Severity & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-350 mb-1">Tags</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. android, export, crash (comma separated)"
                className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-550 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* AI formatting raw log box */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5 font-mono">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                AI Raw Trace / Log Formatter
              </span>
              <button
                type="button"
                onClick={handleFormatRaw}
                disabled={formattingRaw || !rawLog.trim()}
                className="flex items-center gap-1.5 rounded bg-violet-600 px-3 py-1 text-[10px] font-bold text-white uppercase hover:bg-violet-500 disabled:opacity-40 select-none cursor-pointer"
              >
                {formattingRaw ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Formatting...</span>
                  </>
                ) : (
                  'AI Format'
                )}
              </button>
            </div>
            <textarea
              rows={3}
              value={rawLog}
              onChange={(e) => setRawLog(e.target.value)}
              placeholder="Dump stack trace, console outputs, crash logs or raw unstructured email drafts here..."
              className="w-full rounded-lg border border-slate-900 bg-slate-950/60 p-3 text-xs text-slate-300 placeholder-slate-550 focus:border-violet-500 focus:outline-none font-mono"
            />
          </div>

          {/* Structured workflow fields */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-900">
              Structured Diagnosis
            </span>

            <div>
              <label className="block text-xs font-semibold text-slate-350 mb-1">Steps to Reproduce</label>
              <textarea
                rows={3}
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="1. First step...&#10;2. Second step..."
                className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Expected Behavior</label>
                <textarea
                  rows={3}
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="What should have happened..."
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Actual Behavior</label>
                <textarea
                  rows={3}
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  placeholder="What actually happened..."
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Issue Relations */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-900">
              Dependencies & Linking
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Blocked By (Dependencies)</label>
                <select
                  multiple
                  value={blockedByIds}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
                    setBlockedByIds(values);
                  }}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 p-2 text-xs text-slate-300 focus:outline-none min-h-[80px]"
                >
                  {existingBugs.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id}: {b.title.substring(0, 40)}...
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Hold Ctrl/Cmd to select multiple dependencies</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Blocks (Blocks other bugs)</label>
                <select
                  multiple
                  value={blockingIds}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
                    setBlockingIds(values);
                  }}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 p-2 text-xs text-slate-300 focus:outline-none min-h-[80px]"
                >
                  {existingBugs.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id}: {b.title.substring(0, 40)}...
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Hold Ctrl/Cmd to select multiple blockers</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 shrink-0">
            <Link
              href="/bugs"
              className="rounded-lg border border-slate-850 px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Submitting...' : 'File Bug'}</span>
            </button>
          </div>
        </form>

        {/* AI Copilot Sidepanel (Right 1 col) */}
        <div className="space-y-6">
          {/* Triage Suggestions */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center gap-1.5 font-mono">
                <Sparkles className="h-4 w-4 text-violet-400" />
                AI Triage Co-pilot
              </span>
              <button
                type="button"
                onClick={handleTriggerTriage}
                disabled={triaging || !title}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-bold uppercase border border-violet-500/20 bg-violet-600/5 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer select-none"
              >
                {triaging ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Triage'}
              </button>
            </div>

            {triageSuggestions ? (
              <div className="space-y-3">
                <div className="space-y-2 rounded-lg border border-violet-900/20 bg-violet-950/5 p-3.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Severity</span>
                    <span className="font-semibold text-white">{triageSuggestions.severity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Priority</span>
                    <span className="font-semibold text-white">{triageSuggestions.priority}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Suggested Component</span>
                    <span className="font-semibold text-white">{triageSuggestions.suggestedComponent}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Suggested Assignee</span>
                    <span className="font-semibold text-white">
                      {triageSuggestions.suggestedAssignee || 'Unassigned (No matched owner)'}
                    </span>
                  </div>
                  <div className="border-t border-slate-900/60 pt-2 mt-1">
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">Analysis reasoning</span>
                    <p className="text-[10px] text-slate-400 italic leading-relaxed mt-0.5">
                      "{triageSuggestions.confidenceReason}"
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyTriage}
                  className="w-full py-2 rounded-lg bg-violet-600 text-white font-semibold text-xs hover:bg-violet-500 transition-colors shadow-sm select-none cursor-pointer"
                >
                  Accept Suggestions
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-650 font-mono text-[10px] leading-relaxed">
                {triaging ? 'Analyzing bug dynamics...' : 'Click "Triage" above to auto-detect severity, priority, component and assignee.'}
              </div>
            )}
          </div>

          {/* Semantic Duplicate Warning */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-350 block pb-2 border-b border-slate-900 font-mono">
              Live Duplicate Auditor
            </span>

            {checkingDuplicates ? (
              <div className="flex justify-center items-center py-6 gap-2 text-xs font-mono text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Checking duplicates...</span>
              </div>
            ) : duplicates.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                  <AlertOctagon className="h-4.5 w-4.5" />
                  <span>Found {duplicates.length} potential duplicates:</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {duplicates.map((dup) => (
                    <div key={dup.bugId} className="rounded-lg border border-amber-900/20 bg-amber-950/5 p-3 text-xs">
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <Link
                          href={`/bugs/${dup.bugId}`}
                          target="_blank"
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          #{dup.bugId}: {dup.title.substring(0, 30)}...
                        </Link>
                        <span className="text-[10px] text-amber-500 font-mono font-bold bg-amber-950/40 px-1 rounded">
                          {dup.similarityScore}% match
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal italic">
                        "{dup.reason}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-650 font-mono text-[10px]">
                No similar issues detected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
