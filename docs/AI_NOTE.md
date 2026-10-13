# AI note

**Provider:** Groq API, model `llama-3.3-70b-versatile` (Llama 3.3 70B). Gemini (`gemini-2.0-flash`) is an
optional backup. Both are called over plain HTTPS from `backend/ai_service.py`, with the key stored only in the
backend `.env`.

**Why Groq:** very fast responses (good for a live form), a free tier, and a native JSON output mode, which
suits a structured classification task.

**Feature 1: ticket triage** (`POST /api/ai/analyze`). Input: title + description. The model returns JSON with
`category`, `priority` and `solution` (3 to 5 numbered steps). The result pre-fills the form; the employee can edit
it before submitting.

**Feature 2: reply drafting** (`POST /api/tickets/{id}/draft-reply`). Input: ticket details. Output: a short,
polite message the agent can edit and copy.

**Prompt design:** a system prompt fixes the role, lists the allowed category and priority values, defines what each
priority means, and demands JSON only. Temperature is 0.2 for consistent answers.

**Safety and reliability**
- Ticket text is treated as data; the prompt tells the model to ignore instructions inside it.
- Model output is parsed defensively (fences stripped) and every field is forced into the allowed values.
- Fallback chain: primary provider, then backup provider, then keyword rules, so ticket creation never fails.
- Inputs are length-limited by the API schemas.

**Limitations:** the model can misjudge priority or suggest a wrong fix, so it is advisory. Prompt injection is
reduced, not eliminated. No rate limiting or response caching. Ticket text is sent to a third-party API, so real
deployments should avoid including passwords or personal data and review the provider's data policy.
