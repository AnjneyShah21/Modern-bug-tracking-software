import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

// GET: fetch single bug details
export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const bugId = Number(params.id);
    if (isNaN(bugId)) {
      return NextResponse.json({ error: 'Invalid Bug ID' }, { status: 400 });
    }

    const bug = await prisma.bug.findUnique({
      where: { id: bugId },
      include: {
        project: true,
        component: true,
        reporter: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        watchers: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true, role: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true, role: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        activityLogs: {
          include: {
            changedBy: {
              select: { id: true, name: true, email: true, role: true, avatar: true },
            },
          },
          orderBy: { timestamp: 'desc' },
        },
        blocking: {
          include: {
            bug: { select: { id: true, title: true, status: true } },
          },
        },
        blockedBy: {
          include: {
            blockedBy: { select: { id: true, title: true, status: true } },
          },
        },
        duplicateOf: {
          select: { id: true, title: true, status: true },
        },
        duplicates: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    if (!bug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    return NextResponse.json(bug);
  } catch (error: any) {
    console.error('Error fetching bug detail:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: update bug fields & log audit trail
export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const bugId = Number(params.id);
    if (isNaN(bugId)) {
      return NextResponse.json({ error: 'Invalid Bug ID' }, { status: 400 });
    }

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
      assigneeId,
      dueDate,
      tags,
      changedById,
      watcherIds,
      blockingIds,
      blockedByIds,
      duplicateOfId,
    } = body;

    if (!changedById) {
      return NextResponse.json({ error: 'Editor user ID (changedById) is required' }, { status: 400 });
    }

    const oldBug = await prisma.bug.findUnique({
      where: { id: bugId },
      include: { watchers: true, assignee: true },
    });

    if (!oldBug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    const updatedBug = await prisma.$transaction(async (tx: any) => {
      const auditLogs: any[] = [];
      const changedFields: string[] = [];

      const trackChange = (field: string, oldVal: any, newVal: any) => {
        if (String(oldVal) !== String(newVal)) {
          auditLogs.push({
            bugId,
            field,
            oldValue: oldVal !== null && oldVal !== undefined ? String(oldVal) : null,
            newValue: newVal !== null && newVal !== undefined ? String(newVal) : null,
            changedById,
          });
          changedFields.push(field);
        }
      };

      if (title !== undefined) trackChange('title', oldBug.title, title);
      if (description !== undefined) trackChange('description', oldBug.description, description);
      if (stepsToReproduce !== undefined) trackChange('stepsToReproduce', oldBug.stepsToReproduce, stepsToReproduce);
      if (expectedBehavior !== undefined) trackChange('expectedBehavior', oldBug.expectedBehavior, expectedBehavior);
      if (actualBehavior !== undefined) trackChange('actualBehavior', oldBug.actualBehavior, actualBehavior);
      if (severity !== undefined) trackChange('severity', oldBug.severity, severity);
      if (priority !== undefined) trackChange('priority', oldBug.priority, priority);
      if (status !== undefined) trackChange('status', oldBug.status, status);
      if (projectId !== undefined) trackChange('projectId', oldBug.projectId, projectId);
      if (componentId !== undefined) trackChange('componentId', oldBug.componentId, componentId);
      if (assigneeId !== undefined) {
        const oldAssigneeName = oldBug.assignee ? oldBug.assignee.name : null;
        let newAssigneeName = null;
        if (assigneeId) {
          const u = await tx.user.findUnique({ where: { id: assigneeId } });
          newAssigneeName = u ? u.name : assigneeId;
        }
        trackChange('assigneeId', oldAssigneeName, newAssigneeName);
      }
      if (dueDate !== undefined) {
        const oldDateStr = oldBug.dueDate ? new Date(oldBug.dueDate).toISOString().split('T')[0] : null;
        const newDateStr = dueDate ? new Date(dueDate).toISOString().split('T')[0] : null;
        trackChange('dueDate', oldDateStr, newDateStr);
      }
      if (tags !== undefined) trackChange('tags', oldBug.tags.join(', '), tags.join(', '));
      if (duplicateOfId !== undefined) trackChange('duplicateOfId', oldBug.duplicateOfId, duplicateOfId ? Number(duplicateOfId) : null);

      const updated = await tx.bug.update({
        where: { id: bugId },
        data: {
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          stepsToReproduce: stepsToReproduce !== undefined ? stepsToReproduce : undefined,
          expectedBehavior: expectedBehavior !== undefined ? expectedBehavior : undefined,
          actualBehavior: actualBehavior !== undefined ? actualBehavior : undefined,
          severity: severity !== undefined ? severity : undefined,
          priority: priority !== undefined ? priority : undefined,
          status: status !== undefined ? status : undefined,
          projectId: projectId !== undefined ? projectId : undefined,
          componentId: componentId !== undefined ? componentId : undefined,
          assigneeId: assigneeId !== undefined ? (assigneeId || null) : undefined,
          dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
          tags: tags !== undefined ? tags : undefined,
          duplicateOfId: duplicateOfId !== undefined ? (duplicateOfId ? Number(duplicateOfId) : null) : undefined,
          watchers: watcherIds ? {
            set: watcherIds.map((id: string) => ({ id })),
          } : undefined,
        },
        include: { watchers: true, assignee: true },
      });

      if (auditLogs.length > 0) {
        await tx.activityLog.createMany({ data: auditLogs });
      }

      if (blockingIds !== undefined) {
        await tx.bugRelation.deleteMany({ where: { blockedById: bugId } });
        for (const blockId of blockingIds) {
          await tx.bugRelation.create({ data: { bugId: Number(blockId), blockedById: bugId } });
        }
      }

      if (blockedByIds !== undefined) {
        await tx.bugRelation.deleteMany({ where: { bugId } });
        for (const blockId of blockedByIds) {
          await tx.bugRelation.create({ data: { bugId, blockedById: Number(blockId) } });
        }
      }

      if (changedFields.length > 0) {
        const message = `Bug #${bugId} updated: changed fields: ${changedFields.join(', ')}`;
        const notifyUserIds = new Set<string>();
        if (updated.assigneeId && updated.assigneeId !== changedById) {
          notifyUserIds.add(updated.assigneeId);
        }
        updated.watchers.forEach((w: any) => {
          if (w.id !== changedById) notifyUserIds.add(w.id);
        });
        const notifications = Array.from(notifyUserIds).map((uid) => ({ userId: uid, bugId, message }));
        if (notifications.length > 0) {
          await tx.notification.createMany({ data: notifications });
        }
      }

      return updated;
    });

    return NextResponse.json(updatedBug);
  } catch (error: any) {
    console.error('Error updating bug:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: remove bug report
export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const bugId = Number(params.id);
    if (isNaN(bugId)) {
      return NextResponse.json({ error: 'Invalid Bug ID' }, { status: 400 });
    }
    await prisma.bug.delete({ where: { id: bugId } });
    return NextResponse.json({ success: true, message: 'Bug deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting bug:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
