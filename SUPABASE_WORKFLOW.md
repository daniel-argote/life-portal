# Supabase Schema Workflow

This file outlines the steps to manage your Supabase database schema using the Supabase CLI.

## One-Time Setup

These steps have already been completed.

1.  **Initialize Supabase in your project:**
    ```bash
    npx supabase init
    ```
2.  **Link your local project to your remote Supabase project:**
    ```bash
    npx supabase link --project-ref <your-project-ref>
    ```
3.  **Pull the remote schema to a local migration file:**
    ```bash
    npx supabase db pull
    ```

## Development Workflow

Follow these steps to make and apply schema changes.

1.  **Start the local Supabase environment:**
    ```bash
    npx supabase start
    ```
    This will give you a local instance of Supabase, including a local database and Supabase Studio.

2.  **Make schema changes:**
    You can make changes in a few ways:
    *   **Using Supabase Studio:** Access the local Studio and modify your tables and policies through the UI.
    *   **Editing SQL files:** Directly edit the SQL files in the `supabase/migrations` directory.

3.  **Generate a new migration:**
    After you've made your changes, create a new migration file to capture them:
    ```bash
    npx supabase db diff -f <migration_name>
    ```
    Replace `<migration_name>` with a descriptive name for your changes (e.g., `create_users_table`).

4.  **Apply migrations:**

    *   **To your local database:**
        ```bash
        npx supabase migration up
        ```
    *   **To your remote (production) database:**
        ```bash
        npx supabase db push
        ```

## Other Useful Commands

*   **Reset your local database:**
    ```bash
    npx supabase db reset
    ```
*   **Generate TypeScript types from your schema:**
    ```bash
    npx supabase gen types typescript --linked > src/types/supabase.ts
    ```

## Troubleshooting Common Errors

If you see these errors in the browser console, follow these steps.

### 400 Bad Request / PGRST204 (Column Not Found)
**Problem:** The app is trying to use a column (e.g., `description`) that the database API doesn't know about yet.

**Solution:**
1.  **Check Local:** Run `npx supabase db reset` to ensure your local Postgres has all migrations applied.
2.  **Check Remote:** Run `npx supabase db push` to ensure your production database has the same schema.
3.  **Check Types:** Run the `gen types` command above to ensure your code matches the new schema.

### 404 Not Found (Table Not Found)
**Problem:** The table (e.g., `todos`) exists in your migrations but not in the active database.

**Solution:**
1.  Run `npx supabase db reset` to rebuild the local database from your migration files.
2.  **Restart:** If resetting doesn't help, run `npx supabase stop` and then `npx supabase start` to clear the API's schema cache.

### Authentication Failures after `db reset`
**Problem:** You're logged in, but getting "JWT expired" or "User not found" errors.

**Solution:**
1.  **Sign Out and Sign In:** `db reset` wipes the local Auth users. You must re-authenticate to create a fresh user and session.
