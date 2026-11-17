# Tasks

All content comes from `design.md` → Appendix A only. Do not add product, stack, or process decisions that are not recorded there. Write every file in English.

## 1. STRUCTURE.md

- [x] 1.1 Create `STRUCTURE.md` at the repository root with these sections:
  - **Overview:** purpose, plus pointers to `ROADMAP.md` and `openspec/config.yaml`.
  - **Folder layout:** the A8 tree, with a one-line purpose per folder.
  - **Where logic lives:** the A8 layering diagram and rules.
  - **Naming conventions:** the A8 table.
  - **Language rule:** from A8.
  
  Verify: every A8 rule and every naming row appears in the file.
- [x] 1.2 Add a **Data flows** section to `STRUCTURE.md` covering:
  - the request path (route → feature hooks → `api.ts` → Supabase)
  - the capture pipeline (A6 steps 1–4, statuses, retry, `embedding_status`)
  - the Ask flow (A6 steps 1–6, with server-verified citations)
  - quotas (per user plus global, from `plan_limits`)
  - the offline behaviour (A6)
  
  Verify: the statuses and steps match A2 and A6 word for word in meaning.
- [x] 1.3 Add **Conventions** sections to `STRUCTURE.md`:
  - **Styling and theming:** semantic tokens, NativeWind, no hex values, base UI vs feature UI lists from A5.
  - **State, errors, config, and secrets:** from A8.
  - **Testing:** Jest + React Native Testing Library next to files, Deno tests for Edge Functions, Maestro flows in `e2e/`.
  - **Git workflow:** the A8 flow, branch naming, Conventional Commits, green CI, and that the agent explains Git/PR steps to the user in plain Indonesian.
  
  Verify: no statement in `STRUCTURE.md` lacks a source in Appendix A.

## 2. ROADMAP.md

- [x] 2.1 Create `ROADMAP.md` at the repository root with:
  - a short purpose
  - "How to use" (copy an entry's propose prompt into a new session)
  - the checkbox legend exactly as the design D3 table (meaning + when ticked)
  - the A8 change flow
  
  Verify: the legend matches D3 for all four boxes.
- [x] 2.2 Add the MVP section with changes 0–18 in the A9 order. Each entry has:
  - a `### <n>. <change-name>` heading (mark 16 and 17 as Should)
  - four checkboxes: Proposed, Reviewed, Applied, Archived
  - the one-line scope
  - a fenced `text` block starting with `/openspec-propose <change-name>:`, holding that change's decided details from Appendix A and an "Out of scope" line naming the neighbouring items (design D4)
  
  Verify: there are 19 entries, the names match A9 exactly, and each has 4 checkboxes and 1 prompt.
- [x] 2.3 Check the detail-heavy prompts carry the decided specifics:
  - **2** (`setup-design-system`): the full Tomato token table, Today-card, record-button and Record-screen colours, mood scale, typography, spacing/radius, theme mode, base UI list (A5).
  - **3** (`setup-supabase-backend`): every table and column, RLS, bucket path, keep-alive ping (A6).
  - **6** (`add-audio-recording`): the recording rules (A2, A4 S08).
  - **7** (`add-ai-processing-pipeline`): the pipeline and the AI adapter rules (A6, A7).
  - **12** (`add-ask-journal`): the Ask flow (A6).
  - **14** (`add-demo-account`): demo details (A3, A6).
  
  Verify: each item in this list can be found in the matching prompt.
- [x] 2.4 Add the "Later" section with the 12 A9 Later changes in order. Each has the same four checkboxes and a short propose prompt built from its A9 line.

  Verify: there are 12 entries in A9 order, and `add-mood-insights` comes first.

## 3. openspec/config.yaml

- [x] 3.1 Replace the template `openspec/config.yaml` (keep `schema: spec-driven`, drop the template comments) and add a `context` literal block with:
  - the app summary and two audiences (A1)
  - hard constraints: Expo, dev first, Rp 0 production with free tiers only (ask the user before any paid service), the language rule
  - key product decisions from A2–A4 in short form
  - a visual system summary (A5, pointing to `ROADMAP.md` change 2 for token values)
  - the stack (A7)
  - structure rules in short form (A8, pointing to `STRUCTURE.md`)
  - the workflow (`ROADMAP.md`, one change = one branch = one PR; the user is new to Git/PRs)
  - the A7 "verify at implementation time" list
  
  Verify: `openspec context --json` resolves the root without error, and the `context` string measures under 51,200 bytes (UTF-8).
- [x] 3.2 Add `rules`:
  - **`proposal`:**
    - name the `ROADMAP.md` entry being implemented and stay within its scope
    - always list Out of scope
    - state the cost impact (Rp 0) of any new service or dependency
    - if an agreed decision changes, say so and list which of `STRUCTURE.md`, `ROADMAP.md`, `openspec/config.yaml` the change updates
  - **`design`:**
    - follow the `STRUCTURE.md` layering and justify any deviation
    - name each new dependency with its reason and free-tier status
    - UI uses semantic tokens and `src/ui` components and covers the empty, loading, error, offline, and quota states
    - data goes through SQL migrations, with RLS on every table and secrets only in Supabase
    - AI goes only through the adapter, with Zod validation
    - list any free-tier facts that must be verified
  - **`tasks`:**
    - small tasks in dependency order, each with its verification
    - tests land in the same group as the code (Jest/RNTL, Deno for functions, Maestro once `e2e/` exists)
    - doc updates are included when the change alters `STRUCTURE.md`, `ROADMAP.md`, or the config
    - no tasks outside the roadmap entry's scope
  
  Verify: `openspec instructions proposal --change project-blueprint --json` returns the new context and the proposal rules.
- [x] 3.3 Add `operations.apply.guidance` (design D3, D6, D8):
  - talk to the user in Bahasa Indonesia; code, commits, and docs in English
  - at start, find the change in `ROADMAP.md` and tick Proposed and Reviewed (ask if it is unclear that the user reviewed the artifacts)
  - from `setup-project-foundation` on: work on `feat/<change-name>` created from `main`, use Conventional Commits, and explain each `git`/`gh` step in plain Indonesian; `setup-project-foundation` starts with the initial commit of the blueprint files and gives a full first-PR walkthrough
  - follow `STRUCTURE.md`; never put secrets in the app or call AI providers from the app; ask before adding any paid service
  - run typecheck, lint, and tests
  - when every task is checked and the checks pass, tick Applied, push, open the PR with `gh`, and guide the user through green CI and merging
  - do not expand scope; suggest a new `ROADMAP.md` entry instead
  - `project-blueprint` itself makes no branch or commit
  
  Verify: `openspec instructions apply --change project-blueprint --json` shows this guidance.
- [x] 3.4 Add `operations.archive.guidance` (design D3, D6, D7):
  - archive only after the change's PR is merged into `main`; `project-blueprint` is archived right after apply, without a PR
  - before archiving, switch to `main` and pull
  - tick Archived in `ROADMAP.md`
  - commit the archive edits on `main` as `chore(openspec): archive <change-name>` and push; `project-blueprint` makes no commit, because its files go into the initial commit of `setup-project-foundation`
  - summarize the result to the user in Bahasa Indonesia
  
  Verify: `openspec instructions archive --change project-blueprint --json` shows this guidance.

## 4. Integration checks

- [x] 4.1 Cross-check all three files against Appendix A:
  - every A1–A9 decision is present in at least one file
  - no file contains a decision missing from Appendix A
  - the change names are identical in `ROADMAP.md`, `STRUCTURE.md`, and `config.yaml`
  
  Verify: a short checklist of A1–A9 with each ticked.
- [x] 4.2 Run `openspec validate project-blueprint` and confirm that `git status` shows only `STRUCTURE.md`, `ROADMAP.md`, `openspec/config.yaml`, and the change folder as new or changed. No app code, `package.json`, or other files.
- [x] 4.3 Tick Proposed, Reviewed, and Applied for change 0 (`project-blueprint`) in `ROADMAP.md`, leaving Archived unticked. Verify by reading the entry.

## Workflow follow-up

- Archive `project-blueprint` right after apply, without a PR or commit, following the new archive guidance. Then tick Archived for change 0 in `ROADMAP.md`.
- The next change is `setup-project-foundation`. It starts by committing these files as the initial commit on `main`.
