/**
 * invoke-llm — wraps the Anthropic API for frontend AI Growth features.
 * Expects: { prompt: string, response_json_schema?: object }
 * Returns: the parsed JSON object matching response_json_schema, or { text } if no schema.
 */
import { corsHeaders, handleCors } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500, headers: corsHeaders });
  }

  const { prompt, response_json_schema } = await req.json();
  if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400, headers: corsHeaders });

  const systemPrompt = response_json_schema
    ? `You are a helpful assistant. Always respond with valid JSON matching this schema: ${JSON.stringify(response_json_schema)}. Respond ONLY with the JSON object, no markdown, no explanation.`
    : 'You are a helpful assistant.';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: `Anthropic API error: ${err}` }, { status: 502, headers: corsHeaders });
  }

  const { content } = await res.json();
  const text = content?.[0]?.text ?? '';

  if (response_json_schema) {
    try {
      const parsed = JSON.parse(text);
      return Response.json(parsed, { headers: corsHeaders });
    } catch {
      return Response.json({ error: 'LLM returned invalid JSON', raw: text }, { status: 502, headers: corsHeaders });
    }
  }

  return Response.json({ text }, { headers: corsHeaders });
});
