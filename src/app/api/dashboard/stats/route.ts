import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const [
      openCount,
      criticalCount,
      resolvedThisWeekCount,
      overdueCount,
      bugs,
      recentLogs,
    ] = await Promise.all([
      // 1. Open Bugs (not resolved/closed)
      prisma.bug.count({
        where: {
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      }),
      // 2. Critical Bugs
      prisma.bug.count({
        where: {
          severity: 'CRITICAL',
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      }),
      // 3. Resolved this week
      prisma.bug.count({
        where: {
          status: 'RESOLVED',
          updatedAt: { gte: oneWeekAgo },
        },
      }),
      // 4. Overdue bugs
      prisma.bug.count({
        where: {
          status: { notIn: ['RESOLVED', 'CLOSED'] },
          dueDate: { lt: now },
        },
      }),
      // 5. Fetch all bugs to build aggregations
      prisma.bug.findMany({
        select: {
          status: true,
          severity: true,
        },
      }),
      // 6. Recent activity logs
      prisma.activityLog.findMany({
        take: 6,
        orderBy: { timestamp: 'desc' },
        include: {
          bug: { select: { id: true, title: true } },
          changedBy: { select: { name: true, avatar: true } },
        },
      }),
    ]);

    // Compute Status and Severity Distributions
    const statusCounts: Record<string, number> = {
      NEW: 0,
      TRIAGED: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
    };

    const severityCounts: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    bugs.forEach((bug: any) => {
      if (statusCounts[bug.status] !== undefined) statusCounts[bug.status]++;
      if (severityCounts[bug.severity] !== undefined) severityCounts[bug.severity]++;
    });

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
    }));

    const severityData = Object.entries(severityCounts).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({
      metrics: {
        open: openCount,
        critical: criticalCount,
        resolvedThisWeek: resolvedThisWeekCount,
        overdue: overdueCount,
      },
      statusDistribution: statusData,
      severityDistribution: severityData,
      recentActivity: recentLogs,
    });
  } catch (error: any) {
    console.error('Error generating dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
