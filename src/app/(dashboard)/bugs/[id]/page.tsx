'use client';

import React, { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Paperclip,
  History,
  MessageSquare,
  FileText,
  User as UserIcon,
  HelpCircle,
  AlertCircle,
  UserPlus,
  Trash2,
  ChevronRight as CornerDownRight,
} from 'lucide-react';
import Link from 'next/link';

type BugStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type Priority = 'P0' | 'P1' | 'P2' | 'P3';
type Role = 'ADMIN' | 'DEVELOPER' | 'REPORTER' | 'QA';

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3'];

interface UserSelectOption {
  id: string;
  name: string;
  role: string;
}

interface BugDetail {
  id: number;
  title: string;
  description: string;
  stepsToReproduce: string | null;
  expectedBehavior: string | null;
  actualBehavior: string | null;
  severity: Severity;
  priority: Priority;
  status: BugStatus;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  project: { name: string };
  componentId: string;
  component: { name: string };
  reporterId: string;
  reporter: { id: string; name: string; avatar: string | null };
  assigneeId: string | null;
  assignee: { id: string; name: string; avatar: string | null } | null;
  watchers: { id: string; name: string; avatar: string | null }[];
  comments: {
    id: string;
    text: string;
    createdAt: string;
    author: { name: string; avatar: string | null };
  }[];
  attachments: {
    id: string;
    filename: string;
    url: string;
    createdAt: string;
    uploadedBy: { name: string };
  }[];
  activityLogs: {
    id: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
    timestamp: string;
    changedBy: { name: string };
  }[];
  blocking: { bug: { id: number; title: string; status: BugStatus } }[];
  blockedBy: { blockedBy: { id: number; title: string; status: BugStatus } }[];
  duplicateOf: { id: number; title: string; status: BugStatus } | null;
  duplicates: { id: number; title: string; status: BugStatus }[];
}

type Params = Promise<{ id: string }>;

export default function BugDetailPage(props: { params: Params }) {
  const params = use(props.params);
  const bugId = Number(params.id);

  const { data: session } = useSession();
  const router = useRouter();

  const [bug, setBug] = useState<BugDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Users lists for dropdown assignments
  const [usersList, setUsersList] = useState<UserSelectOption[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history'>('details');

  // Input states for editing
  const [isEditingText, setIsEditingText] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSteps, setEditSteps] = useState('');
  const [editExpected, setEditExpected] = useState('');
  const [editActual, setEditActual] = useState('');

  // Comment and attachment inputs
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // AI Summarization
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const fetchBugDetails = async () => {
    try {
      const res = await fetch(`/api/bugs/${bugId}`);
      if (res.ok) {
        const data = await res.json();
        setBug(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditSteps(data.stepsToReproduce || '');
        setEditExpected(data.expectedBehavior || '');
        setEditActual(data.actualBehavior || '');
      } else {
        setError('Issue not found in directory database.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to query bug endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isNaN(bugId)) {
      fetchBugDetails();
      fetchUsers();
    }
  }, [bugId]);

  // Update specific fields (assignee, priority, severity, status, etc.)
  const handleUpdateField = async (updatePayload: any) => {
    if (!bug || !session?.user) return;
    try {
      const res = await fetch(`/api/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatePayload,
          changedById: (session.user as any).id,
        }),
      });

      if (res.ok) {
        fetchBugDetails(); // Reload data
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Enforce workflow transitions
  const getWorkflowTransitions = (currentStatus: BugStatus) => {
    switch (currentStatus) {
      case 'NEW':
        return [
          { label: 'Triage Issue', status: 'TRIAGED' },
          { label: 'Start Coding', status: 'IN_PROGRESS' },
        ];
      case 'TRIAGED':
        return [
          { label: 'Start Coding', status: 'IN_PROGRESS' },
          { label: 'Decline / Close', status: 'CLOSED' },
        ];
      case 'IN_PROGRESS':
        return [
          { label: 'Submit for Review', status: 'IN_REVIEW' },
          { label: 'Resolve Fixed', status: 'RESOLVED' },
        ];
      case 'IN_REVIEW':
        return [
          { label: 'Resolve Fixed', status: 'RESOLVED' },
          { label: 'Reopen / Reject', status: 'REOPENED' },
        ];
      case 'RESOLVED':
        return [
          { label: 'Close Issue', status: 'CLOSED' },
          { label: 'Reopen Issue', status: 'REOPENED' },
        ];
      case 'CLOSED':
        return [{ label: 'Reopen Issue', status: 'REOPENED' }];
      case 'REOPENED':
        return [
          { label: 'Start Coding', status: 'IN_PROGRESS' },
          { label: 'Resolve Fixed', status: 'RESOLVED' },
        ];
      default:
        return [];
    }
  };

  // Submit edits for Title/Description text blocks
  const handleSaveTextEdits = async () => {
    if (!bug) return;
    await handleUpdateField({
      title: editTitle,
      description: editDescription,
      stepsToReproduce: editSteps,
      expectedBehavior: editExpected,
      actualBehavior: editActual,
    });
    setIsEditingText(false);
  };

  // Delete Bug Handler
  const handleDeleteBug = async () => {
    if (confirm('Are you absolutely sure you want to delete this bug report permanently?')) {
      try {
        const res = await fetch(`/api/bugs/${bugId}`, { method: 'DELETE' });
        if (res.ok) {
          router.push('/bugs');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Submit Comments
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user) return;

    setPostingComment(true);
    try {
      const res = await fetch(`/api/bugs/${bugId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: (session.user as any).id,
          text: newComment,
        }),
      });

      if (res.ok) {
        setNewComment('');
        fetchBugDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
    }
  };

  // Submit File Attachments
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !session?.user) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('uploadedById', (session.user as any).id);

    try {
      const res = await fetch(`/api/bugs/${bugId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSelectedFile(null);
        fetchBugDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingFile(false);
    }
  };

  // AI Thread Summarizer trigger
  const handleSummarizeThread = async () => {
    setSummarizing(true);
    setAiSummary(null);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bugId }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSummarizing(false);
    }
  };

  // Check Watchers Checkbox status
  const isWatching = bug?.watchers.some((w) => w.id === (session?.user as any)?.id);
  const handleToggleWatch = () => {
    if (!bug || !session?.user) return;
    const currentUserId = (session.user as any).id;
    let newWatcherIds = bug.watchers.map((w) => w.id);

    if (isWatching) {
      newWatcherIds = newWatcherIds.filter((id) => id !== currentUserId);
    } else {
      newWatcherIds.push(currentUserId);
    }

    handleUpdateField({ watcherIds: newWatcherIds });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 font-mono">Querying issue details...</p>
        </div>
      </div>
    );
  }

  if (error || !bug) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Retrieval Outage</h2>
        <p className="text-xs text-slate-450">{error || 'Bug data file not found.'}</p>
        <Link href="/bugs" className="text-xs text-violet-400 font-bold hover:underline block">
          Return to Explorer
        </Link>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role as Role;
  const isAdmin = userRole === 'ADMIN';
  const isDeveloper = userRole === 'DEVELOPER';
  const isQA = userRole === 'QA';
  const isReporter = userRole === 'REPORTER';

  // Enforce role permission logic
  const canDelete = isAdmin;
  const canEditStatus = isAdmin || isDeveloper || isQA;
  const canEditMetadata = isAdmin || isDeveloper || isQA;
  const canEditText = isAdmin || isReporter || isDeveloper;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header: ID, Title, Project, Workflow Controls */}
      <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500">BUG #{bug.id}</span>
              <span className="rounded bg-slate-900 border border-slate-850 px-2 py-0.5 text-[9px] font-mono text-slate-400 uppercase">
                {bug.project.name}
              </span>
              <span className="rounded bg-slate-900 border border-slate-850 px-2 py-0.5 text-[9px] font-mono text-slate-400 uppercase">
                {bug.component.name}
              </span>
            </div>
            {isEditingText ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-base text-slate-200 focus:outline-none"
              />
            ) : (
              <h1 className="text-xl font-bold text-white tracking-tight truncate leading-tight">
                {bug.title}
              </h1>
            )}
          </div>

          {/* Workflow Action State Transitions */}
          {canEditStatus && (
            <div className="flex items-center gap-2 flex-wrap">
              {getWorkflowTransitions(bug.status).map((transition) => (
                <button
                  key={transition.status}
                  onClick={() => handleUpdateField({ status: transition.status })}
                  className="rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 px-3 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider select-none cursor-pointer"
                >
                  {transition.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-450 border-t border-slate-900/60 pt-3 select-none">
          <span>Submitted by <span className="font-semibold text-slate-300">{bug.reporter.name}</span></span>
          <span>•</span>
          <span>Last modified {new Date(bug.updatedAt).toLocaleDateString()} at {new Date(bug.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Main Grid split: Content tabs on left (2 cols), Sidebar metadata editing on right (1 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Left Area - Tabs Navigation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-slate-900 pb-px gap-1 select-none">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'details'
                  ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-250'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Details & Attachments</span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'comments'
                  ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-250'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Discussion Thread</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'history'
                  ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-250'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Audit Trail</span>
            </button>
          </div>

          {/* Details Tab content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Problem fields */}
              <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnosis Detail</span>
                  {canEditText && (
                    <button
                      onClick={() => (isEditingText ? handleSaveTextEdits() : setIsEditingText(true))}
                      className="text-[10px] text-violet-400 font-bold hover:underline uppercase"
                    >
                      {isEditingText ? 'Save Changes' : 'Edit Text'}
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Description Summary</span>
                    {isEditingText ? (
                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200 mt-1 focus:outline-none"
                      />
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap mt-1">
                        {bug.description}
                      </p>
                    )}
                  </div>

                  {/* Steps */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Steps to Reproduce</span>
                    {isEditingText ? (
                      <textarea
                        rows={3}
                        value={editSteps}
                        onChange={(e) => setEditSteps(e.target.value)}
                        className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200 mt-1 focus:outline-none font-mono"
                      />
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap mt-1 font-mono bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/60">
                        {bug.stepsToReproduce || 'No steps cataloged.'}
                      </p>
                    )}
                  </div>

                  {/* Expected / Actual Behavior */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono block uppercase">Expected Behavior</span>
                      {isEditingText ? (
                        <textarea
                          rows={3}
                          value={editExpected}
                          onChange={(e) => setEditExpected(e.target.value)}
                          className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200 mt-1 focus:outline-none"
                        />
                      ) : (
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                          {bug.expectedBehavior || 'No expectations logged.'}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-mono block uppercase">Actual Behavior</span>
                      {isEditingText ? (
                        <textarea
                          rows={3}
                          value={editActual}
                          onChange={(e) => setEditActual(e.target.value)}
                          className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200 mt-1 focus:outline-none"
                        />
                      ) : (
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                          {bug.actualBehavior || 'No observations logged.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dependencies (blocking / blockedBy / duplicateOf) */}
              <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-900">
                  Relational Links
                </span>

                <div className="space-y-3.5">
                  {/* Duplicate Of */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Duplicate Outage Link</span>
                    {bug.duplicateOf ? (
                      <Link
                        href={`/bugs/${bug.duplicateOf.id}`}
                        className="text-xs text-amber-400 font-semibold hover:underline flex items-center gap-1.5 mt-1"
                      >
                        <HelpCircle className="h-4 w-4" />
                        <span>#{bug.duplicateOf.id}: {bug.duplicateOf.title} ({bug.duplicateOf.status})</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono block mt-1">No duplicates linked.</span>
                    )}
                  </div>

                  {/* Blocked By */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Blocked By (Dependencies)</span>
                    {bug.blockedBy.length === 0 ? (
                      <span className="text-xs text-slate-500 font-mono block mt-1">No blockers registered.</span>
                    ) : (
                      <div className="space-y-1.5 mt-1.5">
                        {bug.blockedBy.map((rel) => (
                          <div key={rel.blockedBy.id} className="flex items-center gap-2 text-xs">
                            <CornerDownRight className="h-3.5 w-3.5 text-slate-655" />
                            <Link href={`/bugs/${rel.blockedBy.id}`} className="font-semibold text-slate-300 hover:text-violet-400 hover:underline">
                              #{rel.blockedBy.id}: {rel.blockedBy.title}
                            </Link>
                            <span className="rounded bg-slate-900 border border-slate-850 px-1.5 py-0.2 text-[9px] text-slate-500 uppercase">{rel.blockedBy.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Blocking */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Blocking Issues</span>
                    {bug.blocking.length === 0 ? (
                      <span className="text-xs text-slate-500 font-mono block mt-1">No dependents registered.</span>
                    ) : (
                      <div className="space-y-1.5 mt-1.5">
                        {bug.blocking.map((rel) => (
                          <div key={rel.bug.id} className="flex items-center gap-2 text-xs">
                            <CornerDownRight className="h-3.5 w-3.5 text-slate-655" />
                            <Link href={`/bugs/${rel.bug.id}`} className="font-semibold text-slate-300 hover:text-violet-400 hover:underline">
                              #{rel.bug.id}: {rel.bug.title}
                            </Link>
                            <span className="rounded bg-slate-900 border border-slate-850 px-1.5 py-0.2 text-[9px] text-slate-500 uppercase">{rel.bug.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-900">
                  Attachments & Files
                </span>

                {/* Upload Form */}
                <form onSubmit={handleUploadFile} className="flex gap-2 items-center flex-wrap">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-800 file:bg-slate-900 file:text-xs file:font-semibold file:text-slate-300 file:cursor-pointer hover:file:bg-slate-800"
                  />
                  {selectedFile && (
                    <button
                      type="submit"
                      disabled={uploadingFile}
                      className="rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition-colors shadow-sm select-none cursor-pointer"
                    >
                      {uploadingFile ? 'Uploading...' : 'Upload File'}
                    </button>
                  )}
                </form>

                {/* Files List */}
                {bug.attachments.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-900/60 rounded-xl text-slate-550 font-mono text-[10px]">
                    No attached crash dumps or screenshots.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bug.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="rounded-lg border border-slate-900/80 bg-slate-900/30 p-3 flex items-center justify-between text-xs hover:border-slate-850"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-4 w-4 text-slate-500 shrink-0" />
                          <a
                            href={file.url}
                            target="_blank"
                            className="font-semibold text-slate-300 hover:text-violet-400 hover:underline truncate"
                          >
                            {file.filename}
                          </a>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono shrink-0">
                          by {file.uploadedBy.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments Tab content */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              {/* AI Thread Summarization */}
              <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center gap-1.5 font-mono">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    AI Thread Summarizer
                  </span>
                  <button
                    onClick={handleSummarizeThread}
                    disabled={summarizing || bug.comments.length === 0}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-bold uppercase border border-violet-500/20 bg-violet-600/5 px-2 py-0.5 rounded cursor-pointer select-none disabled:opacity-40"
                  >
                    {summarizing ? 'Summarizing...' : 'Summarize Thread'}
                  </button>
                </div>

                {aiSummary ? (
                  <div className="rounded-lg border border-violet-900/20 bg-violet-950/5 p-4 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">
                    {aiSummary}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-550 font-mono">
                    Summarize comments, technical proposals, or blockers instantly.
                  </p>
                )}
              </div>

              {/* Feed of comments */}
              <div className="space-y-4">
                {bug.comments.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-900/60 rounded-xl text-slate-550 font-mono text-[10px]">
                    No discussions have been started.
                  </div>
                ) : (
                  bug.comments.map((comment) => (
                    <div key={comment.id} className="rounded-xl border border-slate-900/80 bg-slate-900/20 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {comment.author.avatar ? (
                            <img src={comment.author.avatar} alt="avatar" className="h-6 w-6 rounded-full bg-slate-800" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                              {comment.author.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-white">{comment.author.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Leave a Comment Form */}
              <form onSubmit={handlePostComment} className="space-y-3.5 pt-4 border-t border-slate-900">
                <textarea
                  rows={3}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post an update, add @mentions, or catalog logs..."
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-550 focus:border-violet-500 focus:outline-none"
                />
                <div className="flex justify-end select-none">
                  <button
                    type="submit"
                    disabled={postingComment || !newComment.trim()}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {postingComment ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* History tab content */}
          {activeTab === 'history' && (
            <div className="rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md overflow-hidden">
              {bug.activityLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-550 font-mono text-xs">No audit logs.</div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    <tr>
                      <th className="p-3.5 pl-5">Who</th>
                      <th className="p-3.5">Action Field</th>
                      <th className="p-3.5">Old Value</th>
                      <th className="p-3.5">New Value</th>
                      <th className="p-3.5 pr-5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-mono text-[10px] text-slate-350">
                    {bug.activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/10">
                        <td className="p-3.5 pl-5 font-semibold text-slate-200">{log.changedBy.name}</td>
                        <td className="p-3.5 text-violet-400 font-bold">{log.field}</td>
                        <td className="p-3.5 text-slate-400 line-through truncate max-w-[120px]" title={log.oldValue || ''}>
                          {log.oldValue || 'none'}
                        </td>
                        <td className="p-3.5 text-emerald-400 font-semibold truncate max-w-[120px]" title={log.newValue || ''}>
                          {log.newValue || 'none'}
                        </td>
                        <td className="p-3.5 pr-5 text-slate-500">
                          {new Date(log.timestamp).toLocaleDateString()} at{' '}
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Right Area - Metadata Sidepanel config */}
        <div className="space-y-6">
          {/* Metadata properties Card */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-350 block pb-2 border-b border-slate-900 font-mono">
              Metadata Properties
            </span>

            {/* Workflow state */}
            <div>
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Workflow Status</span>
              <span className="inline-block rounded bg-violet-600/15 border border-violet-500/20 px-2.5 py-1 text-xs font-bold text-violet-400 uppercase tracking-wide mt-1.5 select-none">
                {bug.status.replace('_', ' ')}
              </span>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1.5">Assignee</label>
              {canEditMetadata ? (
                <select
                  value={bug.assigneeId || ''}
                  onChange={(e) => handleUpdateField({ assigneeId: e.target.value || null })}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Unassigned</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <UserIcon className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-semibold text-white">{bug.assignee?.name || 'Unassigned'}</span>
                </div>
              )}
            </div>

            {/* Severity */}
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1.5">Severity</label>
              {canEditMetadata ? (
                <select
                  value={bug.severity}
                  onChange={(e) => handleUpdateField({ severity: e.target.value })}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-slate-200 mt-1 block">{bug.severity}</span>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1.5">Priority</label>
              {canEditMetadata ? (
                <select
                  value={bug.priority}
                  onChange={(e) => handleUpdateField({ priority: e.target.value })}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-slate-200 mt-1 block">{bug.priority}</span>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1.5">Due Date</label>
              {canEditMetadata ? (
                <input
                  type="date"
                  value={bug.dueDate ? bug.dueDate.split('T')[0] : ''}
                  onChange={(e) => handleUpdateField({ dueDate: e.target.value || null })}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500 font-mono"
                />
              ) : (
                <span className="text-xs text-slate-300 font-mono block mt-1">
                  {bug.dueDate ? new Date(bug.dueDate).toLocaleDateString() : 'No deadline.'}
                </span>
              )}
            </div>
          </div>

          {/* Watchers list Card */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-350 font-mono">
                Watchers & CC
              </span>
              <button
                onClick={handleToggleWatch}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-bold uppercase flex items-center gap-1 cursor-pointer select-none"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{isWatching ? 'Stop Watch' : 'Watch'}</span>
              </button>
            </div>

            {bug.watchers.length === 0 ? (
              <div className="text-center py-4 text-slate-650 font-mono text-[10px]">
                No one is watching this bug.
              </div>
            ) : (
              <div className="space-y-2.5">
                {bug.watchers.map((w) => (
                  <div key={w.id} className="flex items-center gap-2.5 text-xs">
                    {w.avatar ? (
                      <img src={w.avatar} alt="avatar" className="h-5.5 w-5.5 rounded-full bg-slate-800" />
                    ) : (
                      <div className="h-5.5 w-5.5 rounded-full bg-slate-850 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        {w.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-slate-300 font-medium">{w.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Administrative Settings */}
          {canDelete && (
            <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-5 backdrop-blur-md space-y-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 block pb-2 border-b border-red-500/10 font-mono">
                Administrative Zone
              </span>
              <button
                onClick={handleDeleteBug}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-sm select-none cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Bug Report</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
