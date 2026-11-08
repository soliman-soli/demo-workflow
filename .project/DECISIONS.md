# Architectural Decisions

1. **Zero-Leak Server Proxy**: The browser only calls `/api/hr/*`. `n8nFetch` injects `X-API-KEY` server-side, enforces a 60s timeout, validates upstream payloads with Zod, and strips internal errors.
2. **Next.js 16 `proxy.ts`**: Uses Next.js 16's `src/proxy.ts` convention (plus server-component verification and API route verification) to guard `/projects/hr-system/hr/dashboard` with an `httpOnly` `jose` HS256 JWT cookie.
3. **Strict PDF Validation**: Files are verified for `application/pdf` MIME type, `<= 4 MB` size (below Vercel's 4.5 MB body limit), and `%PDF-` magic bytes.
4. **Rate Limiting**: Uses Upstash Redis REST pipeline when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, falling back to an in-memory sliding window limiter.
5. **Candidate Privacy on Apply**: `POST /api/hr/apply` returns `202 Accepted` with `{ ok: true, message }` only, never exposing the screening score or auto-decision to the applicant.

