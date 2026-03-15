const COMPANY_INTELLIGENCE_PROMPT = `You are a company research assistant.
Given a company name, estimate public company profile details.
Return ONLY valid JSON with these exact keys:
company_name, industry, business_activity, estimated_company_size, headquarters_location, years_in_operation, company_description, market_presence, risk_indicators, confidence_score.

Rules:
- confidence_score must be an integer between 0 and 100.
- risk_indicators should be a short string, comma-separated.
- If uncertain, provide best-effort values and lower confidence_score.`;

const extractJson = (content) => {
  if (!content) return null;
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const normalizePayload = (data) => ({
  company_name: data?.company_name ?? '',
  industry: data?.industry ?? '',
  business_activity: data?.business_activity ?? '',
  estimated_company_size: data?.estimated_company_size ?? '',
  headquarters_location: data?.headquarters_location ?? '',
  years_in_operation: data?.years_in_operation ?? '',
  company_description: data?.company_description ?? '',
  market_presence: data?.market_presence ?? '',
  risk_indicators: data?.risk_indicators ?? '',
  confidence_score: Number.isFinite(Number(data?.confidence_score)) ? Number(data.confidence_score) : 0,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const companyName = String(req.body?.companyName || '').trim();
  if (companyName.length < 3) {
    return res.status(400).json({ error: 'companyName must be at least 3 characters' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: COMPANY_INTELLIGENCE_PROMPT },
          { role: 'user', content: `Company name: ${companyName}` },
        ],
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      return res.status(openAiResponse.status).json({ error: errorText || 'Model request failed' });
    }

    const completion = await openAiResponse.json();
    const rawContent = completion?.choices?.[0]?.message?.content;
    const parsed = extractJson(rawContent);
    if (!parsed) {
      return res.status(502).json({ error: 'Unable to parse model JSON response' });
    }

    return res.status(200).json(normalizePayload(parsed));
  } catch (error) {
    console.error('company-intelligence error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
