# LYNUX Admin Core — Starter

This is the first architectural layer for the reusable LYNUX Admin Core.

## What exists now

- A centralized feature registry
- 60+ stock feature switches grouped by business function
- A client configuration object
- A server-safe feature lookup layer
- A private-master vs client implementation selector
- A master control dashboard UI
- Sharp / editorial visual direction instead of generic rounded SaaS cards

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Important

This starter proves the module/feature architecture. Authentication, database persistence,
audit logs, client provisioning, and Supabase RLS are the next security layer and should be
implemented before using this in production.
