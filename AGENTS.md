# Next.js 16 Notes

Key differences from earlier versions:

- `params` in route handlers, layouts, and pages is now a `Promise` — always `await` it
- Route handlers: export named async functions (`GET`, `POST`, etc.) from `app/**/route.ts`
- Dynamic route params: `{ params }: { params: Promise<{ id: string }> }`
- Layouts/pages are Server Components by default; use `'use client'` for interactivity
- `Response.json()` and `NextResponse` for route handler responses
- No `getServerSideProps` / `getStaticProps` — use async Server Components instead
