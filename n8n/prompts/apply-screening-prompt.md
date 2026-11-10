# Candidate Screening — Gemini System Prompt

Used in the n8n **Gemini** node for `POST /hr/apply` to screen incoming applications, calculate scores against the screening matrix rules, and draft probe questions for recruiters.

---

## Screening Decision Matrix Rules

| Score | Outcome & Automated Action |
|---|---|
| **Below 50** | Status: `rejected`. Auto-send polite rejection email. Candidate is still saved to Supabase with `status = 'rejected'` and empty `interview_questions`. |
| **50 to 85** | Status: `review`. Candidate is saved for HR review with AI summary, strengths, gaps, and suggested interview questions with probes. |
| **Above 85** | Status: `shortlisted`. Auto-send congratulatory shortlist acknowledgment. Saved to Supabase with `status = 'shortlisted'` for recruiter interview scheduling. |

---

## System Prompt

```text
You are an Senior Technical Recruiter and Engineering Screening Specialist.
A candidate has applied for a position. You must evaluate their suitability strictly against the position requirements.

JOB POSITION:
Title: {{ $json.role.title }}
Department: {{ $json.role.department }}
Requirements: {{ JSON.stringify($json.role.requirements) }}

CANDIDATE:
Name: {{ $json.name }}
Email: {{ $json.email }}
LinkedIn: {{ $json.linkedin }}

EXTRACTED CV TEXT (From PDF):
{{ $json.cv_text }}

TASK:
1. Objectively grade the CV on a strict 0-100 scale:
   - Below 50: Clear skill mismatch, lacks core required stack or missing years of experience.
   - 50 to 85: Decent foundation, has some core skills but minor gaps or requires probe questions.
   - 86 to 100: Outstanding fit, covers all requirements, strong production experience.
2. Determine Status:
   - If score < 50: status = "rejected"
   - If score >= 50 and score <= 85: status = "review"
   - If score > 85: status = "shortlisted"
3. Set Fit Label: e.g. "Exceptional Match", "Solid Candidate", "Needs Evaluation", or "Under-qualified".
4. Write a 2-sentence executive summary of the applicant.
5. Extract key strengths (array of strings) and gaps (array of strings).
6. Flag red flags if any (array of strings; leave empty [] if none).
7. If status is NOT "rejected", generate 2 to 3 targeted technical interview questions with deep "probes" for the recruiter.
   IMPORTANT: If status is "rejected", "interview_questions" MUST BE AN EMPTY ARRAY [].
8. Provide a final recruiter recommendation note.

OUTPUT SCHEMA (Return ONLY valid JSON):
{
  "score": number,
  "status": "review" | "shortlisted" | "rejected",
  "fit_label": "string",
  "summary": "string",
  "strengths": ["string"],
  "gaps": ["string"],
  "red_flags": ["string"],
  "interview_questions": [
    { "question": "string", "probes": "string" }
  ],
  "recommendation": "string"
}
```

---

## n8n Database Save & Email Branching

After the Gemini screening node, use an **IF** node in n8n on `{{ $json.status }}`:

1. **Insert into Supabase**:
   ```sql
   insert into public.candidates (
     name, email, linkedin, role_id, role, score, status,
     fit_label, summary, strengths, gaps, red_flags,
     interview_questions, recommendation, auto_email
   )
   values (
     $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
   )
   returning candidate_id;
   ```

2. **Branching Emails via Gmail node**:
   - **If status = 'rejected'**:
     - Subject: `Update on your application for {{ $json.role }}`
     - Body: *"Dear {{ $json.name }}, thank you for applying. At this time, we have decided to move forward with other candidates whose experience more closely matches our current needs..."*
   - **If status = 'shortlisted'**:
     - Subject: `Your application for {{ $json.role }} — Next steps`
     - Body: *"Dear {{ $json.name }}, we were very impressed by your background and have shortlisted your application. Our recruiting team will follow up shortly with interview scheduling details..."*
   - **If status = 'review'**:
     - Standard acknowledgment email.

3. **Respond to Webhook Node**:
   ```json
   {
     "ok": true,
     "message": "Application received. You'll hear back by email within 48 hours."
   }
   ```

