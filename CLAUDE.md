# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # Install deps, generate Prisma client, run migrations
npm run dev          # Start dev server (Next.js + Turbopack) at localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all tests with Vitest
npm run db:reset     # Reset SQLite database (destructive)
```

Run a single test file:
```bash
npx vitest run src/lib/__tests__/file-system.test.ts
```

## Architecture

**UIGen** is an AI-powered React component generator with live preview. Users describe a component in chat, Claude generates it via streaming tool calls, and the result is previewed in-browser via Babel JSX compilation.

### Request Flow

1. User sends message → `POST /api/chat`
2. Server calls `streamText()` (Vercel AI SDK) with Anthropic Claude
3. Claude responds with tool calls: `str_replace_editor` (create/update/delete files) and `file_manager`
4. Tool results update the **VirtualFileSystem** (in-memory, no disk writes)
5. FileSystem state is serialized and saved to the `Project.data` field in SQLite
6. Preview iframe compiles JSX in-browser via `@babel/standalone`

### Key Abstractions

- **VirtualFileSystem** (`src/lib/file-system.ts`): In-memory file tree. Serialized as JSON into `Project.data`. All generated code lives here.
- **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`): React context wrapping VirtualFileSystem, drives both the editor and preview.
- **ChatContext** (`src/lib/contexts/chat-context.tsx`): Manages message history and streaming state.
- **AI Provider** (`src/lib/provider.ts`): Returns Anthropic client if `ANTHROPIC_API_KEY` is set, otherwise falls back to `MockLanguageModel`.
- **AI Tools** (`src/lib/tools/`): `str_replace_editor` for file CRUD, `str-replace.ts` for targeted string replacement within files.
- **Server Actions** (`src/actions/`): Auth (`getUser`, `signIn`, `signUp`, `signOut`) and project CRUD. JWT sessions via `jose`, stored in cookies.

### App Router Structure

```
src/app/
├── page.tsx              # Redirects authenticated users to their project, or shows main UI
├── main-content.tsx      # Root UI: chat panel + resizable preview/code panel
├── [projectId]/          # Dynamic route for a specific project
└── api/chat/             # Streaming AI endpoint
```

### Data Model

- **User**: email + bcrypt password
- **Project**: belongs to optional User (supports anonymous), stores `messages` (JSON array) and `data` (serialized VirtualFileSystem)

### Path Alias

`@/*` maps to `src/*` throughout the codebase.

### Testing

Tests are colocated in `__tests__/` directories next to the code they test. Uses Vitest + jsdom + Testing Library. No special setup required beyond `npm run setup`.
