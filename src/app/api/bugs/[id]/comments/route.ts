import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const bugId = Number(params.id);
    if (isNaN(bugId)) {
      return NextResponse.json({ error: 'Invalid Bug ID' }, { status: 400 });
    }

    const body = await req.json();
    const { authorId, text } = body;

    if (!authorId || !text) {
      return NextResponse.json({ error: 'Missing authorId or comment text' }, { status: 400 });
    }

    const comment = await prisma.$transaction(async (tx: any) => {
      // 1. Create the comment
      const newComment = await tx.comment.create({
        data: {
          bugId,
          authorId,
          text,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true, avatar: true },
          },
        },
      });

      // 2. Fetch bug and watchers
      const bug = await tx.bug.findUnique({
        where: { id: bugId },
        include: { watchers: true },
      });

      if (bug) {
        // 3. Notify assignees and watchers
        const notifyUserIds = new Set<string>();
        if (bug.assigneeId && bug.assigneeId !== authorId) {
          notifyUserIds.add(bug.assigneeId);
        }
        bug.watchers.forEach((w: any) => {
          if (w.id !== authorId) {
            notifyUserIds.add(w.id);
          }
        });

        const notifications = Array.from(notifyUserIds).map((uid) => ({
          userId: uid,
          bugId,
          message: `${newComment.author.name} commented on Bug #${bugId}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        }));

        if (notifications.length > 0) {
          await tx.notification.createMany({ data: notifications });
        }
      }

      return newComment;
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
