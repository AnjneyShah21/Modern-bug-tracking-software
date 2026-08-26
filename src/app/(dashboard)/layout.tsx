'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bug,
  LayoutDashboard,
  Kanban,
  ListTodo,
  PlusCircle,
  Bell,
  LogOut,
  User as UserIcon,
  Search,
  Check,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  bugId: number;
  message: string;
  read: boolean;
  createdAt: string;
  bug: { title: string };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [nlSearchQuery, setNlSearchQuery] = useState('');
  const [nlSearching, setNlSearching] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!session?.user) return;
    try {
      const userId = (session.user as any).id;
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
      // Poll notifications every 10 seconds for real-time updates
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [status, session]);

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!session?.user) return;
    try {
      const userId = (session.user as any).id;
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNlSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlSearchQuery.trim() || !session?.user) return;

    setNlSearching(true);
    try {
      const res = await fetch('/api/ai/nl-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: nlSearchQuery,
          currentUserId: (session.user as any).id,
          currentUserName: session.user.name,
        }),
      });

      if (res.ok) {
        const filters = await res.json();
        // Convert filters to query string and route to bugs page
        const params = new URLSearchParams();
        if (filters.projectId) params.set('projectId', filters.projectId);
        if (filters.componentId) params.set('componentId', filters.componentId);
        if (filters.status) params.set('status', filters.status);
        if (filters.severity) params.set('severity', filters.severity);
        if (filters.priority) params.set('priority', filters.priority);
        if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
        if (filters.reporterId) params.set('reporterId', filters.reporterId);
        if (filters.q) params.set('q', filters.q);

        router.push(`/bugs?${params.toString()}`);
      }
    } catch (err) {
      console.error('NL Search error:', err);
    } finally {
      setNlSearching(false);
      setNlSearchQuery('');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navLinks = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Kanban Board', href: '/kanban', icon: Kanban },
    { label: 'All Bugs', href: '/bugs', icon: ListTodo },
    { label: 'File a Bug', href: '/bugs/new', icon: PlusCircle },
  ];

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-sm text-slate-400 font-mono">Loading layout modules...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  const currentUser = session?.user as any;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-slate-900 bg-slate-950/60 p-5 flex flex-col justify-between backdrop-blur-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-500/10">
              <Bug className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">Bugzilla</span>
              <span className="text-[10px] block font-mono text-violet-400 font-bold -mt-1 uppercase tracking-wider">Reimagined</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20 shadow-sm shadow-violet-500/5'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-violet-400' : 'text-slate-450'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Block */}
        <div className="border-t border-slate-900 pt-4 mt-6">
          <div className="flex items-center gap-3 px-2 py-1">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt="user avatar"
                className="h-9 w-9 rounded-full ring-2 ring-slate-800 bg-slate-900"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-none">{currentUser?.name}</p>
              <p className="text-[10px] text-violet-400 font-medium truncate mt-0.5">{currentUser?.designation || 'Team Member'}</p>
              <p className="text-[9px] text-slate-500 font-mono truncate uppercase tracking-wider">{currentUser?.role}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign Out"
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-900 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-md sticky top-0 z-20">
          {/* AI Search Bar */}
          <form onSubmit={handleNlSearch} className="w-full max-w-lg relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="AI Search: 'assigned to me that are critical and open'..."
              value={nlSearchQuery}
              onChange={(e) => setNlSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-900 bg-slate-900/40 py-1.5 pl-10 pr-12 text-sm text-slate-200 placeholder-slate-550 focus:border-violet-500/60 focus:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-violet-500/60 transition-all font-sans"
              disabled={nlSearching}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase border border-slate-700">
              <Sparkles className="h-3 w-3 text-violet-400 animate-pulse" />
              <span>AI</span>
            </div>
          </form>

          {/* Right Header Panel */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg transition-colors border ${
                  showNotifications
                    ? 'bg-slate-900 border-slate-800 text-violet-400'
                    : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white ring-2 ring-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-slate-850 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-4 z-50 text-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-semibold text-violet-400 hover:underline hover:text-violet-355 flex items-center gap-1"
                      >
                        <CheckSquare className="h-3 w-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 select-none">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500 font-mono">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) handleMarkAsRead(n.id);
                            router.push(`/bugs/${n.bugId}`);
                            setShowNotifications(false);
                          }}
                          className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                            n.read
                              ? 'bg-slate-950/20 border-transparent hover:bg-slate-900/60'
                              : 'bg-violet-950/10 border-violet-900/20 hover:bg-violet-950/20'
                          }`}
                        >
                          <p className={`text-xs ${n.read ? 'text-slate-400' : 'text-slate-200 font-semibold'}`}>
                            {n.message}
                          </p>
                          <span className="text-[9px] text-slate-500 block mt-1 font-mono">
                            {new Date(n.createdAt).toLocaleDateString()} at{' '}
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick role indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-850 bg-slate-900/30 text-xs font-mono font-bold text-slate-450 uppercase tracking-wider select-none">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{currentUser?.role}</span>
            </div>
          </div>
        </header>

        {/* Page Content Panel */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
