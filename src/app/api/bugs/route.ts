import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BugStatusValues = ['NEW', 'TRIAGED', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'CLOSED', 'REOPENED'];
const SeverityValues = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PriorityValues = ['P0', 'P1', 'P2', 'P3'];

// GET: list/filter bugs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;
    const componentId = searchParams.get('componentId') || undefined;
    const status = searchParams.get('status') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const assigneeId = searchParams.get('assigneeId') || undefined;
    const reporterId = searchParams.get('reporterId') || undefined;
    const query = searchParams.get('q') || '';
    const tagsParam = searchParams.get('tags');

    const where: any = {};

    if (projectId) where.projectId = projectId;
    if (componentId) where.componentId = componentId;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (priority) where.priority = priority;

    if (assigneeId === 'null') {
      where.assigneeId = null;
    } else if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (reporterId) where.reporterId = reporterId;

    if (tagsParam) {
      const tags = tagsParam.split(',').map((t) => t.trim());
      where.tags = { hasSome: tags };
    }

    if (query) {
      const orClauses: any[] = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
      if (!isNaN(Number(query))) {
        orClauses.push({ id: Number(query) });
      }
      where.OR = orClauses;
    }

    const bugs = await prisma.bug.findMany({
      where,
      include: {
        project: true,
        component: true,
        reporter: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bugs);
  } catch (error: any) {
    console.error('Error in GET /api/bugs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: create a new bug
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      priority,
      status,
      projectId,
      componentId,
      reporterId,
      assigneeId,
      tags,
      dueDate,
      blockingIds,
      blockedByIds,
      duplicateOfId,
    } = body;

    if (!title || !description || !projectId || !componentId || !reporterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bug = await prisma.$transaction(async (tx: any) => {
      const newBug = await tx.bug.create({
        data: {
          title,
          description,
          stepsToReproduce,
          expectedBehavior,
          actualBehavior,
          severity: severity || 'MEDIUM',
          priority: priority || 'P2',
          status: status || 'NEW',
          tags: tags || [],
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId,
          componentId,
          reporterId,
          assigneeId: assigneeId || null,
          duplicateOfId: duplicateOfId ? Number(duplicateOfId) : null,
        },
        include: {
          reporter: true,
          assignee: true,
        },
      });

      if (blockingIds && Array.isArray(blockingIds)) {
        for (const blockId of blockingIds) {
          await tx.bugRelation.create({
            data: { bugId: Number(blockId), blockedById: newBug.id },
          });
        }
      }

      if (blockedByIds && Array.isArray(blockedByIds)) {
        for (const blockId of blockedByIds) {
          await tx.bugRelation.create({
            data: { bugId: newBug.id, blockedById: Number(blockId) },
          });
        }
      }

      await tx.activityLog.create({
        data: {
          bugId: newBug.id,
          field: 'creation',
          newValue: `Bug created by ${newBug.reporter.name}`,
          changedById: reporterId,
        },
      });

      if (assigneeId) {
        await tx.activityLog.create({
          data: {
            bugId: newBug.id,
            field: 'assigneeId',
            newValue: newBug.assignee?.name || assigneeId,
            changedById: reporterId,
          },
        });
        await tx.notification.create({
          data: {
            userId: assigneeId,
            bugId: newBug.id,
            message: `You have been assigned to new bug #${newBug.id}: "${title}"`,
          },
        });
      }

      return newBug;
    });

    return NextResponse.json(bug, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/bugs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
