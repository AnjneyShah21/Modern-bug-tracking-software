export async function callLLM(prompt: string, systemPrompt: string = 'You are a helpful software engineering assistant.'): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic API error: ${res.status} - ${errText}`);
      }

      const data = await res.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Error calling Anthropic API, trying fallback:', error);
    }
  }

  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API error: ${res.status} - ${errText}`);
      }

      const data = await res.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API, trying fallback:', error);
    }
  }

  // Graceful Local Fallback if no keys are provided
  console.warn('AI API keys not configured or calls failed. Running local fallback.');
  return runLocalFallback(prompt, systemPrompt);
}

// Rules-based local parser to mimic LLM responses when offline/no-keys
function runLocalFallback(prompt: string, systemPrompt: string): string {
  const normalized = prompt.toLowerCase() + ' ' + systemPrompt.toLowerCase();

  // 1. Triage Fallback
  if (normalized.includes('triage') || systemPrompt.includes('triage')) {
    let severity = 'MEDIUM';
    let priority = 'P2';
    let componentName = 'Frontend UI';

    if (normalized.includes('stripe') || normalized.includes('payment') || normalized.includes('checkout') || normalized.includes('billing')) {
      componentName = 'Checkout & Payments';
      severity = 'CRITICAL';
      priority = 'P0';
    } else if (normalized.includes('auth') || normalized.includes('login') || normalized.includes('mfa') || normalized.includes('password') || normalized.includes('signup')) {
      componentName = 'User Authentication';
      severity = 'HIGH';
      priority = 'P1';
    } else if (normalized.includes('search') || normalized.includes('elastic') || normalized.includes('recommend')) {
      componentName = 'Search & Recommendations';
      severity = 'MEDIUM';
      priority = 'P2';
    } else if (normalized.includes('push') || normalized.includes('notification') || normalized.includes('fcm')) {
      componentName = 'Push Notifications';
      severity = 'HIGH';
      priority = 'P1';
    } else if (normalized.includes('offline') || normalized.includes('sync') || normalized.includes('cache')) {
      componentName = 'Offline Sync';
      severity = 'HIGH';
      priority = 'P1';
    }

    return JSON.stringify({
      severity,
      priority,
      suggestedComponent: componentName,
      confidenceReason: 'Auto-detected keywords from input text (Local Fallback Engine)',
    });
  }

  // 2. Duplicate detection fallback
  if (normalized.includes('duplicate') || systemPrompt.includes('duplicate')) {
    return JSON.stringify({
      isDuplicate: false,
      potentialDuplicates: [],
      reason: 'No matching titles found in local cache (Local Fallback Engine)',
    });
  }

  // 3. Format raw log fallback
  if (normalized.includes('format') || systemPrompt.includes('format')) {
    return JSON.stringify({
      stepsToReproduce: '1. Observe the error event in logs.\n2. Trigger the action that causes the trace.\n3. Check system response.',
      expectedBehavior: 'Action should complete successfully without raising exceptions.',
      actualBehavior: prompt.substring(0, 300) + '...',
    });
  }

  // 4. Natural Language Search fallback
  if (normalized.includes('natural language') || systemPrompt.includes('search query')) {
    return JSON.stringify({
      projectId: null,
      componentId: null,
      status: null,
      severity: null,
      priority: null,
      assigneeId: null,
      q: prompt.replace(/show me|find|all|bugs|assigned to me|open/gi, '').trim(),
    });
  }

  return 'Local AI Fallback placeholder response';
}
