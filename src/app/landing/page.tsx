'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bug,
  Sparkles,
  Kanban,
  Search,
  ShieldCheck,
  Zap,
  Bot,
  FileCode,
  ArrowRight,
  UserCheck,
  LayoutDashboard,
  Layers,
  Activity,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
              <Bug className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">Bugzilla</span>
              <span className="text-[10px] block font-mono text-violet-400 font-bold -mt-1 uppercase tracking-wider">Reimagined</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-900"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=register"
              className="flex items-center gap-2 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-violet-500/20 transition-all hover:scale-105"
            >
              <span>Register Account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-violet-600/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-mono">
            <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
            <span>Next-Generation Bug & Issue Tracking Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            The contemporary issue tracker for{' '}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              high-velocity teams
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Reimagining classic Bugzilla into a sleek, AI-assisted, Linear-grade issue tracker with drag-and-drop Kanban boards, custom designations, and automated log formatting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login?mode=register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-3.5 rounded-xl shadow-xl shadow-violet-500/25 transition-all hover:scale-105"
            >
              <span>Get Started & Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 text-slate-200 px-6 py-3.5 rounded-xl transition-all"
            >
              <span>Sign In to Existing Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-16 px-6 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Everything you need to ship software with confidence
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Built from the ground up for developers, QA engineers, and project leads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Drag-and-Drop Kanban */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 space-y-4 hover:border-violet-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
                <Kanban className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Interactive Kanban Boards</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamless HTML5 drag-and-drop workflow status transitions. Move tickets effortlessly across <code className="text-violet-300 bg-slate-950 px-1 py-0.5 rounded">NEW</code>, <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">IN_PROGRESS</code>, <code className="text-purple-300 bg-slate-950 px-1 py-0.5 rounded">IN_REVIEW</code>, and <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">RESOLVED</code>.
              </p>
            </div>

            {/* Feature 2: Custom Role & Designation */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 space-y-4 hover:border-indigo-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Custom Designations & Roles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Register with your exact job title (e.g. <i>Senior Frontend Lead</i> or <i>QA Specialist</i>). Role-based permissions enforce who can delete, review, or edit metadata.
              </p>
            </div>

            {/* Feature 3: AI Raw Log Formatter */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 space-y-4 hover:border-purple-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
                <FileCode className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Raw Log & Stack Trace Formatter</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste raw terminal logs, stack traces, or messy customer emails into the filing form. The AI instantly structures them into clean steps to reproduce and expected vs actual behavior.
              </p>
            </div>

            {/* Feature 4: AI Auto-Triage Co-pilot */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 space-y-4 hover:border-emerald-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Smart Triage Co-pilot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                One-click triage automatically analyzes bug descriptions, inspects historical resolvers for that component area, and recommends optimal Severity, Priority, and Assignees.
              </p>
            </div>

            {/* Feature 5: Real-time Duplicate Auditor */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 space-y-4 hover:border-amber-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Live Semantic Duplicate Auditor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevents duplicate filing before it happens! A real-time debounced auditor checks your bug draft against existing database records and warns you if a similar issue exists.
              </p>
            </div>

            {/* Feature 6: Natural Language AI Search */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 space-y-4 hover:border-rose-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Natural Language AI Search</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Search your entire bug database using plain English. Queries like <i>"critical bugs assigned to me in mobile app"</i> are intelligently parsed into structured filters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Call to Action */}
      <footer className="border-t border-slate-900 py-12 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <Bug className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Bugzilla Reimagined</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/login?mode=register" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
