import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callLLM } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { title, description, projectId } = await req.json();

    if (!title || !description || !projectId) {
      return NextResponse.json({ error: 'Missing title, description or projectId' }, { status: 400 });
    }

    // Fetch project components and developer/QA users to feed into the prompt context
    const [project, users] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: { components: true },
      }),
      prisma.user.findMany({
        where: { role: { in: ['DEVELOPER', 'QA', 'ADMIN'] } },
        select: { id: true, name: true, role: true },
      }),
    ]);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const componentsList = project.components.map((c: any) => `- ${c.name} (ID: ${c.id})`).join('\n');
    const usersList = users.map((u: any) => `- ${u.name} (ID: ${u.id}, Role: ${u.role})`).join('\n');

    // Fetch recently resolved bugs in this project to help LLM associate bugs with their resolvers
    const pastBugs = await prisma.bug.findMany({
      where: {
        projectId,
        status: 'RESOLVED',
        assigneeId: { not: null },
      },
      take: 10,
      select: {
        title: true,
        component: { select: { name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    const pastBugsContext = pastBugs.length > 0
      ? pastBugs.map((b: any) => `- Bug: "${b.title}" in Component "${b.component.name}" was resolved by "${b.assignee?.name}" (ID: ${b.assignee?.id})`).join('\n')
      : 'None';

    const systemPrompt = `You are a smart triage assistant for a modern software bug tracking platform.
Your task is to analyze the bug title and description and suggest the most appropriate:
1. Severity (CRITICAL, HIGH, MEDIUM, LOW)
2. Priority (P0, P1, P2, P3)
3. Component (Choose EXACTLY from the provided component list)
4. Assignee (Choose EXACTLY from the provided users list, matching their role/past work)

Here is the list of available components for this project:
${componentsList}

Here is the list of available users to assign:
${usersList}

Here is historical data of resolved bugs and who resolved them:
${pastBugsContext}

You MUST reply with a valid JSON object ONLY. No markdown wrapper, no explanation outside the JSON. The JSON should match this schema:
{
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "priority": "P0" | "P1" | "P2" | "P3",
  "suggestedComponentId": "string (the ID of the component)",
  "suggestedComponent": "string (the name of the component)",
  "suggestedAssigneeId": "string (the ID of the user) or null",
  "suggestedAssignee": "string (the name of the user) or null",
  "confidenceReason": "string explaining your triage recommendations"
}`;

    const prompt = `Bug Title: "${title}"
Bug Description: "${description}"`;

    const responseText = await callLLM(prompt, systemPrompt);

    // Try to parse the response as JSON
    try {
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const suggestions = JSON.parse(cleanJsonStr);
      return NextResponse.json(suggestions);
    } catch (parseError) {
      console.error('LLM output parsing error. Output was:', responseText);
      // Regex recovery if JSON was wrapped in other text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const recoveryData = JSON.parse(jsonMatch[0]);
        return NextResponse.json(recoveryData);
      }
      throw new Error('Failed to parse AI triage response');
    }
  } catch (error: any) {
    console.error('Error in AI triage endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
