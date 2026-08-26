import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callLLM } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { title, description, projectId } = await req.json();

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Missing title or projectId' }, { status: 400 });
    }

    // Fetch all open bugs in the same project
    const openBugs = await prisma.bug.findMany({
      where: {
        projectId,
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
      },
      take: 30, // Limit context length
    });

    if (openBugs.length === 0) {
      return NextResponse.json({ isDuplicate: false, potentialDuplicates: [] });
    }

    const openBugsContext = openBugs
      .map((b: any) => `ID: #${b.id}\nTitle: "${b.title}"\nDescription snippet: "${b.description.substring(0, 150)}"\n---`)
      .join('\n');

    const systemPrompt = `You are an AI assistant designed to detect duplicate bug reports in a software development project.
You will receive a new bug's title and description, and a list of existing open bugs in the project.
Compare the new bug report with the list of open bugs. Determine if the new report is likely a duplicate of any existing bug.

Here are the existing open bugs:
${openBugsContext}

You MUST reply with a valid JSON object ONLY. No markdown wrapper, no explanation outside the JSON. The JSON should match this schema:
{
  "isDuplicate": boolean,
  "potentialDuplicates": [
    {
      "bugId": number,
      "title": "string (the matching bug's title)",
      "similarityScore": number (from 0 to 100, where 100 is exact duplicate),
      "reason": "string explaining why this is a duplicate"
    }
  ]
}`;

    const prompt = `New Bug Title: "${title}"
New Bug Description: "${description || ''}"`;

    const responseText = await callLLM(prompt, systemPrompt);

    try {
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const duplicateData = JSON.parse(cleanJsonStr);
      return NextResponse.json(duplicateData);
    } catch (parseError) {
      console.error('LLM output parsing error in duplicate-detect:', responseText);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]));
      }
      throw new Error('Failed to parse AI duplicate detection response');
    }
  } catch (error: any) {
    console.error('Error in AI duplicate-detect endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
