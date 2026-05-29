# Life Portal - Development Roadmap

## Future Features
- [ ] **Money:** Integrate Plaid API for automated bank transactions (When ready)
- [ ] **Assistant:** Phase 3 (Function Calling / Database Interaction)

## Current Tasks
- [ ] **Assistant:** Activate via `VITE_GEMINI_API_KEY` in `.env`
- [ ] **Assistant:** Phase 2 (Context Awareness: Pass data as context to LLM)
- [x] **Health:** Connect UI to Supabase `health` table
- [x] **Calendar:** Connect UI to Supabase `calendar` table
- [x] **Actions:** Create To Do list module
- [x] **Settings:** Add profile management (email update)
- [ ] **Money:** Add visualization charts
- [ ] **Testing:** Implement Playwright "existence checks" for critical Settings sections (Safety Net)
- [ ] **Testing:** Add Snapshot testing for core modules to prevent UI regressions
- [ ] **Architecture:** Refactor `Settings.jsx` into smaller, atomic components (Profile, Financial, Assistant) to prevent accidental deletions during refactors
