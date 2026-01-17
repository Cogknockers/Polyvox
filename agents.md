# agents.md — Polyvox Agent Operating Rules

This repo may be worked on by coding agents (Codex, Claude Code, aider, etc.).
These rules exist to prevent accidental rewrites, route destruction, secret leaks, and broken builds.

---

## Prime directive

**Do the smallest possible change that satisfies the task.**
Do not refactor, reorganize folders, regenerate scaffolds, or “improve architecture” unless the task explicitly requires it.

---

## Non-negotiables (Polyvox)

- Preserve the jurisdiction hierarchy everywhere: **City → County → State → National/Federal**
- Support cross-jurisdiction aggregation of “local instances” into “canonical issues/clusters”
- Do not hardcode party logic
- Prefer explicit, auditable data structures over cleverness
- Preserve auditability, safety, and long-term maintainability

---

## Task discipline

- One task at a time.
- Before coding: restate the task in 1–3 bullets.
- After coding: provide a short checklist of what changed + how to verify.

---

## Repo safety rules

### Do NOT do these
- Do not overwrite routes or regenerate the Next.js scaffold.
- Do not rename/move large directory trees without a direct requirement.
- Do not delete files “because they look unused” unless verified by the task.
- Do not introduce new dependencies unless absolutely required.

### Always do these
- Prefer restoring from git history over inventing replacements.
- Keep changes localized.
- Keep diffs readable and reviewable.

---

## Git checkpoint rule (for agents)

**RULE:** After completing any major change, create a git checkpoint commit.

**Major change examples:**
- route/page restoration
- a new major feature page or workflow
- schema migrations / RLS changes
- refactors that touch multiple files (only when required)
- anything that changes build behavior

**Checkpoint steps:**
1) `git status` + `git diff` (scan for unwanted files)
2) Stage changes: `git add -A`
3) Unstage unsafe/forbidden paths (never commit these):
   - `.env`, `.env.local`, `.env.*`
   - `node_modules/`
   - `.next/`
   - any secrets/keys (e.g. `**/*.pem`, `**/*secret*`, `**/*key*`)
   - large generated artifacts
   Commands (best-effort; ignore errors if files don’t exist):
   - `git restore --staged .env .env.local .env.* 2>/dev/null || true`
   - `git restore --staged node_modules .next 2>/dev/null || true`
4) Commit with message:
   - `git commit -m "checkpoint: <short description>"`
   - If this is part of an in-progress checkpoint, prefer: `git commit --amend`
5) Run: `npm run build`
6) If build fails:
   - Undo the commit but keep changes: `git reset --soft HEAD~1`
   - Fix errors
   - Recommit (prefer amend over multiple commits)

**Do not** create multiple commits for a single “major change”; prefer amend.

**Done when:** `npm run build` passes after the checkpoint commit.

---

## Safety prerequisites (must be true)

### .gitignore must protect secrets and build outputs
Ensure `.gitignore` includes:
- `.next/`
- `node_modules/`
- `.env`
- `.env.local`
- `.env.*.local`
- `*.pem`
- `**/*secret*`
- `**/*key*`

### Never commit
- any `.env*` files
- `node_modules/` or `.next/`
- private keys, tokens, credentials, or secrets of any kind

### Lockfiles
- If dependency changes occurred, commit the correct lockfile:
  - `package-lock.json` **or** `pnpm-lock.yaml` **or** `yarn.lock`
- Do not commit multiple lockfiles—use the one this repo already uses.

---

## Husky expectations (if installed)

If Husky is present, commits/pushes may be blocked unless checks pass.

Recommended gating:
- **pre-commit:** `npm run lint` + `npm run typecheck`
- **pre-push:** `npm run build`

If hooks fail, fix the underlying issue rather than bypassing hooks.

---

## Recovery-first rule (important)

If the app is broken due to accidental overwrites:
- Prefer `git restore`, `git checkout <commit> -- <paths>`, or `git reset --hard <known_good_commit>`
- Restore route files and configs from history:
  - `app/**/page.tsx`, `app/**/layout.tsx`
  - `next.config.*`, `tsconfig.json`, `package.json`
- Do not “recreate routes from scratch” unless the original cannot be recovered.

---

## Output requirements for agents

When finishing a task, always output:

1) **Summary of changes** (bullets)
2) **Files changed** (list)
3) **Commands to verify**
   - `npm run dev`
   - `npm run build`
4) **Acceptance checklist** (what “done” means)

---

## Definition of done (baseline)

A change is only “done” when:
- `npm run dev` starts successfully
- `npm run build` succeeds
- routes/pages render without runtime crashes (at least the core routes touched)
- no secrets were committed
---END FILE---
