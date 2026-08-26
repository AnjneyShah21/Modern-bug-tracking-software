import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      include: {
        bug: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId, userId, markAll } = body;

    if (markAll) {
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required to mark all as read' }, { status: 400 });
      }
      await prisma.notification.updateMany({
        where: { userId },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
