import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { rawInput } = await req.json();

    if (!rawInput) {
      return NextResponse.json({ error: 'Missing rawInput' }, { status: 400 });
    }

    const systemPrompt = `You are an AI assistant specialized in structured software troubleshooting.
You will be given a raw, unstructured bug report, crash log, console output, or stack trace.
Your task is to parse this information and restructure it into three clean sections:
1. Steps to Reproduce: Bulleted list of how to trigger the issue, inferred from the report.
2. Expected Behavior: What the system should have done under normal conditions.
3. Actual Behavior: What the system actually did (including details about the exception, trace, or crash).

Do NOT make up information. If a section is completely missing or cannot be inferred, write "Not provided in raw report."

You MUST reply with a valid JSON object ONLY. No markdown wrapper, no explanation outside the JSON. The JSON should match this schema:
{
  "stepsToReproduce": "string",
  "expectedBehavior": "string",
  "actualBehavior": "string"
}`;

    const responseText = await callLLM(rawInput, systemPrompt);

    try {
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const formattedFields = JSON.parse(cleanJsonStr);
      return NextResponse.json(formattedFields);
    } catch (parseError) {
      console.error('LLM output parsing error in format-log:', responseText);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]));
      }
      throw new Error('Failed to parse AI formatting response');
    }
  } catch (error: any) {
    console.error('Error in AI format-log endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
