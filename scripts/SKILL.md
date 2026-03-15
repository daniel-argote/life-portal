---
name: supabase
description: A skill for interacting with the Supabase CLI.
---

### start
Starts the local Supabase development environment.

### new_migration
Creates a new database migration file.
- **name** (string, required): The name for the new migration.

### push
Pushes local database changes to the remote Supabase project. **Includes a mandatory pre-flight check:**
1. Runs the project linter (`npm run lint`).
2. Resets and verifies the local database schema (`supabase reset`).
If any step fails, the push is aborted.

### reset
Resets the local database to apply all pending migrations and sync the local schema. **Warning: This clears local database data.**

### gen_types
Generates TypeScript types from your Supabase database schema and saves them to `src/types/supabase.ts`.
