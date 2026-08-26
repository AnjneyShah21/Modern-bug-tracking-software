import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callLLM } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { bugId } = await req.json();

    if (!bugId) {
      return NextResponse.json({ error: 'Missing bugId' }, { status: 400 });
    }

    const bug = await prisma.bug.findUnique({
      where: { id: Number(bugId) },
      include: {
        comments: {
          include: {
            author: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!bug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    if (bug.comments.length === 0) {
      return NextResponse.json({ summary: 'No comments have been posted to summarize yet.' });
    }

    const commentsText = bug.comments
      .map((c: any) => `${c.author.name}: "${c.text}"`)
      .join('\n\n');

    const systemPrompt = `You are a helpful software program management assistant.
You are tasked with summarizing a long bug discussion comment thread.
Provide a concise, professional recap summarizing:
1. Current understanding of the issue.
2. What has been tried or discussed.
3. Current blockers, decision items, or next steps.

Format your output in clean Markdown with sections. Keep it brief (under 150 words).`;

    const prompt = `Bug Title: "${bug.title}"
Bug Description: "${bug.description}"

Comments Thread:
${commentsText}`;

    const summaryText = await callLLM(prompt, systemPrompt);

    return NextResponse.json({ summary: summaryText });
  } catch (error: any) {
    console.error('Error in AI summarize endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
