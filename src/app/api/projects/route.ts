import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [projects, users] = await Promise.all([
      prisma.project.findMany({
        include: {
          components: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ projects, users });
  } catch (error: any) {
    console.error('Error fetching projects/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
