import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callLLM } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { query, currentUserId, currentUserName } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

    // Fetch lists of projects, components, and users to resolve entities
    const [projects, components, users] = await Promise.all([
      prisma.project.findMany({ select: { id: true, name: true } }),
      prisma.component.findMany({ select: { id: true, name: true, projectId: true } }),
      prisma.user.findMany({ select: { id: true, name: true, role: true } }),
    ]);

    const projectsContext = projects.map((p: any) => `- Project: "${p.name}" (ID: "${p.id}")`).join('\n');
    const componentsContext = components.map((c: any) => `- Component: "${c.name}" (ID: "${c.id}" in Project: "${c.projectId}")`).join('\n');
    const usersContext = users.map((u: any) => `- User: "${u.name}" (ID: "${u.id}" Role: "${u.role}")`).join('\n');

    const systemPrompt = `You are a natural language database querying assistant for a bug tracking tool.
Your job is to parse a freeform search query (e.g. "show me all critical bugs in project Acme assigned to me") and map it to a structured filters object.
You have access to the lists of actual IDs and names in the system:

Projects:
${projectsContext}

Components:
${componentsContext}

Users:
${usersContext}

The current user making the search query is:
- Name: "${currentUserName || 'Anonymous'}"
- ID: "${currentUserId || 'none'}"
If the query says "me", "assigned to me", "my bugs", or "i reported", you should resolve that to this user's ID.

You MUST reply with a valid JSON object ONLY. No markdown wrapper. No extra text. The JSON should match this schema:
{
  "projectId": "string (the project ID) or null",
  "componentId": "string (the component ID) or null",
  "status": "NEW" | "TRIAGED" | "IN_PROGRESS" | "IN_REVIEW" | "RESOLVED" | "CLOSED" | "REOPENED" | null,
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null,
  "priority": "P0" | "P1" | "P2" | "P3" | null,
  "assigneeId": "string (the user ID) or null",
  "reporterId": "string (the user ID) or null",
  "q": "string (any remaining freeform text keywords to search title/description, or null)"
}`;

    const responseText = await callLLM(query, systemPrompt);

    try {
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const filters = JSON.parse(cleanJsonStr);
      return NextResponse.json(filters);
    } catch (parseError) {
      console.error('LLM output parsing error in nl-search:', responseText);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]));
      }
      throw new Error('Failed to parse AI NL search response');
    }
  } catch (error: any) {
    console.error('Error in AI nl-search endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
