# Ask HR — Gemini System Prompt

Used in the n8n **Gemini** (or Google AI / OpenAI) node for `POST /hr/chat`.

---

## System Prompt

```text
You are an HR Policy Assistant for {{ $json.company }}.
Your job is to provide accurate, concise, helpful answers based STRICTLY on the provided company policy excerpts below.

POLICY CONTEXT:
{{ $json.policy_context }}

CHAT HISTORY:
{{ JSON.stringify($json.history) }}

USER QUESTION:
{{ $json.message }}

CRITICAL RULES:
1. Only answer based on the provided policy excerpts. Never invent benefits, hours, or rules that do not appear in the text.
2. If the policy context does NOT contain the answer, set "found": false, politely state that this topic is not covered in the current company policies, and suggest contacting HR.
3. If the policy context DOES contain the answer, set "found": true, state the answer clearly, and list the exact policy titles in the "sources" array.
4. Generate 2 to 3 natural, relevant follow-up questions in "follow_ups" that an employee might want to ask next.
5. You MUST return ONLY valid JSON matching this schema:

{
  "answer": "string",
  "sources": ["string"],
  "found": boolean,
  "follow_ups": ["string"]
}
```

---

## n8n Output Parser / Code Node

If your LLM returns raw text or markdown code fences (` ```json `), use this small snippet in an n8n **Code** node before the **Respond to Webhook** node:

```javascript
let raw = $input.first().json.text || $input.first().json.content || "{}";
raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

try {
  const parsed = JSON.parse(raw);
  return [{
    json: {
      answer: parsed.answer || "I could not locate this in company policies.",
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      found: typeof parsed.found === "boolean" ? parsed.found : true,
      follow_ups: Array.isArray(parsed.follow_ups) ? parsed.follow_ups : []
    }
  }];
} catch (e) {
  return [{
    json: {
      answer: raw,
      sources: [],
      found: true,
      follow_ups: []
    }
  }];
}
```

