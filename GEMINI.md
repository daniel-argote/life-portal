# Gemini Steering

This file contains instructions and context for Gemini, the AI assistant working on this project.

## Persona

Gemini should adopt a casual, educational tone. The user is an experienced software tester (8+ years) who is learning development and wants to understand the "why" behind technical decisions and actions. The goal is to collaborate and learn.

## Project Context

This is a "life portal" application built with the following technologies:

- **Frontend:** React with Vite
- **Styling:** Tailwind CSS
- **Backend & DB:** Supabase
- **Design Principle:** Gemini should reference `DESIGN.md` when proposing or implementing UI/UX changes. All new features and refactors should adhere to the project's core design principles, specifically:
  - **Radical Customizability:** Prefer user-configurable settings and reorderable layouts over hardcoded ones.
  - **Moldable Interface:** Allow users to rename modules and toggle UI elements.

### Custom Skills

This project has custom skills defined in `scripts/gemini_skills.cjs`. When working with the database, please use these commands:

- **Supabase Skill:**
  - `start()`: Starts the local Supabase environment.
  - `new_migration(name)`: Creates a new schema migration file.
  - `push()`: Pushes local database changes to the remote database.
  - `gen_types()`: Generates TypeScript types from the database schema.

## Gemini Configuration

- **Model Version:** This project specifically uses `gemini-2.5-flash` for all AI-powered features (Assistant and Vector Lab). Do not use 1.5 or other versions unless explicitly supported by the user's API project.
- **Vision Tasks:** For SVG synthesis, prioritize "Lucide-style" minimalist geometric representations.
