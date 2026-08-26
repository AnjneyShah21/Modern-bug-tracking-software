'use client';

import React, { useState, useEffect } from 'react';
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
  Activity,
  CheckCircle2,
  Terminal,
  Cpu,
  Layers,
} from 'lucide-react';

const MOVING_WORDS = [
  'high-velocity teams',
  'modern developers',
  'QA engineers',
  'software architects',
  'precision teams',
];

const TICKER_ITEMS = [
  { text: '🔥 AI Auto-Triage Co-pilot Active', highlight: 'AI-Powered' },
  { text: '⚡ Drag & Drop Kanban Workflow', highlight: 'Linear UX' },
  { text: '🛡️ Debounced Duplicate Auditor', highlight: 'Real-time' },
  { text: '📝 Automated Stack Trace Formatter', highlight: 'Smart Parsing' },
  { text: '🔍 Natural Language AI Search', highlight: 'NLP Engine' },
  { text: '👤 Custom Job Designation Profiles', highlight: 'Role-Based' },
];

export default function LandingPage() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % MOVING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white overflow-x-hidden">
      {/* Background Animated Gradient Glowing Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Top Moving Marquee Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-950 to-indigo-950 border-b border-violet-500/20 py-2 overflow-hidden z-50">
        <div className="animate-marquee gap-8">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px] font-mono text-slate-300 shrink-0">
              <span className="bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30 uppercase font-bold text-[9px]">
                {item.highlight}
              </span>
              <span>{item.text}</span>
              <span className="text-slate-700 ml-4">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-850/80 bg-slate-950/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 ring-1 ring-white/20">
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
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=register"
              className="flex items-center gap-2 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-lg shadow-lg shadow-violet-500/25 transition-all hover:scale-105 active:scale-95 ring-1 ring-white/20"
            >
              <span>Register Account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-mono shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Next-Generation Bug Tracking Workspace</span>
          </div>

          {/* Dynamic Changing Animated Headline */}
          <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight text-white leading-none min-h-[140px] flex flex-col justify-center items-center">
            <span>The issue workspace for</span>
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent transition-all duration-500 inline-block animate-pulse">
              {MOVING_WORDS[wordIndex]}
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A Linear-grade reimagining of Bugzilla. Built with interactive drag-and-drop Kanban boards, live AI log formatters, debounced duplicate auditors, and custom designations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login?mode=register"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 text-sm font-semibold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl shadow-2xl shadow-violet-500/30 transition-all hover:scale-105 active:scale-95 ring-1 ring-white/20"
            >
              <span>Create Account Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-slate-200 px-8 py-4 rounded-xl transition-all shadow-lg"
            >
              <span>Sign In</span>
            </Link>
          </div>

          {/* Live Interactive UI Banner Preview */}
          <div className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-xl shadow-2xl shadow-violet-950/50 ring-1 ring-white/10 group hover:border-violet-500/30 transition-all">
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-850 space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] font-mono text-slate-500 ml-2">bugzilla-workspace.app/kanban</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-violet-400 font-mono">
                  <Zap className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
                  <span>Live System Active</span>
                </div>
              </div>

              {/* Sample Mini Kanban Column Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-850 space-y-2 hover:border-violet-500/40 transition-colors">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                    <span>NEW (2)</span>
                    <span className="text-[10px] bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">P0</span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">Stripe signature verification failing</div>
                  <div className="text-[10px] text-slate-500 font-mono">Senior Lead Developer</div>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-850 space-y-2 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                    <span>IN_PROGRESS (1)</span>
                    <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">P1</span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">MFA SMS verification timeout</div>
                  <div className="text-[10px] text-slate-500 font-mono">QA Engineer</div>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-850 space-y-2 hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <span>RESOLVED (5)</span>
                    <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Fixed</span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">Navigation header clipping</div>
                  <div className="text-[10px] text-slate-500 font-mono">UI Architect</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 px-6 border-t border-slate-900 bg-slate-950/60 relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Built for precision engineering teams
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Everything required to file, triage, track, and resolve software defects without context switching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-8 space-y-4 hover:border-violet-500/50 hover:bg-slate-900/70 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20 group-hover:scale-110 transition-transform">
                <Kanban className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Interactive Drag & Drop Kanban</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Native HTML5 drag-and-drop workflow status transitions. Move tickets effortlessly across <span className="text-violet-300 font-mono font-semibold">NEW</span>, <span className="text-amber-300 font-mono font-semibold">IN_PROGRESS</span>, <span className="text-purple-300 font-mono font-semibold">IN_REVIEW</span>, and <span className="text-emerald-300 font-mono font-semibold">RESOLVED</span>.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-8 space-y-4 hover:border-indigo-500/50 hover:bg-slate-900/70 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Custom Roles & Designations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Register with your exact job title (e.g. <i>Senior Frontend Lead</i> or <i>QA Specialist</i>). Role-based permissions enforce who can delete, review, or edit metadata.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-8 space-y-4 hover:border-purple-500/50 hover:bg-slate-900/70 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <FileCode className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Raw Log & Stack Formatter</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste raw terminal outputs, stack traces, or messy customer emails into the filing form. The AI instantly structures them into clean steps to reproduce and expected vs actual behavior.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-8 space-y-4 hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Smart Triage Co-pilot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                One-click triage automatically analyzes bug descriptions, inspects historical resolvers for that component area, and recommends optimal Severity, Priority, and Assignees.
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-8 space-y-4 hover:border-amber-500/50 hover:bg-slate-900/70 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Live Semantic Duplicate Auditor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevents duplicate filing before it happens! A real-time debounced auditor checks your bug draft against existing database records and warns you if a similar issue exists.
              </p>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-8 space-y-4 hover:border-rose-500/50 hover:bg-slate-900/70 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Natural Language AI Search</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Search your entire bug database using plain English. Queries like <i>"critical bugs assigned to me in mobile app"</i> are intelligently parsed into structured Prisma filters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Footer */}
      <footer className="border-t border-slate-900 py-16 px-6 bg-slate-950 z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to streamline your issue workflow?
          </h2>
          <p className="text-sm text-slate-400">
            Join software teams managing defects with linear velocity.
          </p>
          <div className="pt-2">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl shadow-xl shadow-violet-500/20 transition-all hover:scale-105"
            >
              <span>Get Started & Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
