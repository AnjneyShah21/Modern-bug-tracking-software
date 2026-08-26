'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bug, Lock, Mail, Terminal, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Invalid credentials');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-sm text-slate-400 font-mono">Initializing Bugzilla Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
            <Bug className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
            Bugzilla <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Reimagined</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A contemporary issue workspace for high-velocity teams
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full rounded-lg border border-slate-850 bg-slate-950 pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-slate-850 bg-slate-950 pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-slate-800 pt-6">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-3">
            <Terminal className="h-3.5 w-3.5 text-violet-400" />
            <span className="font-mono">Demo Accounts (Password: password123)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <button
              onClick={() => handleQuickLogin('admin@bugzilla.com')}
              className="rounded-lg border border-slate-800 bg-slate-950/60 py-2 hover:bg-slate-850 hover:border-slate-700 text-slate-300 font-semibold"
            >
              Sarah (Admin)
            </button>
            <button
              onClick={() => handleQuickLogin('dev1@bugzilla.com')}
              className="rounded-lg border border-slate-800 bg-slate-950/60 py-2 hover:bg-slate-850 hover:border-slate-700 text-slate-300 font-semibold"
            >
              Alex (Dev)
            </button>
            <button
              onClick={() => handleQuickLogin('qa@bugzilla.com')}
              className="rounded-lg border border-slate-800 bg-slate-950/60 py-2 hover:bg-slate-850 hover:border-slate-700 text-slate-300 font-semibold"
            >
              Jane (QA)
            </button>
            <button
              onClick={() => handleQuickLogin('reporter@bugzilla.com')}
              className="rounded-lg border border-slate-800 bg-slate-950/60 py-2 hover:bg-slate-850 hover:border-slate-700 text-slate-300 font-semibold"
            >
              John (Reporter)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
