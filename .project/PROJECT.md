# Project: Soliman Portfolio & AI-Powered HR Demo

## Overview
Personal portfolio website for **Soliman** featuring a live, end-to-end **HR Demo** (`Ask HR`, `Career Coach`, `Apply`, and a passcode-protected `Recruiter Dashboard`).

## Stack
- **Framework**: Next.js 16 (App Router), TypeScript (strict), Tailwind CSS v4
- **Validation & Security**: Zod v4, Jose (HS256 signed `httpOnly` session cookie), `%PDF-` magic-byte file verification, Upstash/in-memory rate limiting, CSP headers
- **Backend Integration**: n8n webhook proxy (`/api/hr/*`), Gemini AI, Google Sheets / Supabase PostgreSQL
- **Testing**: Vitest (unit tests) & Playwright (end-to-end smoke suite)

