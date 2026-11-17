# Proposal

## Why

The explore session settled every foundational decision for Dayspoken: problem, core loop, MVP scope, screens, visual system, data model, stack, structure, and roadmap. Right now those decisions exist only in a chat transcript. Before the first code change (`setup-project-foundation`), they need to live in durable project files. That way every later change is proposed, applied, and archived against the same constraints, and progress through the roadmap is visible in the repo.

## What Changes

- **Add `STRUCTURE.md`** at the repository root. It records:
  - the agreed folder layout (`app/`, `src/features/`, `src/ui/`, `src/theme/`, `src/lib/`, `src/utils/`, `supabase/`, `e2e/`, `docs/`, `openspec/`)
  - naming conventions
  - where logic lives
  - the main data flows (capture pipeline, Ask)
  - the Git workflow
  - the language rule
- **Add `ROADMAP.md`** at the repository root. It lists:
  - the 19 agreed MVP changes (0–18) in order, each with `Proposed / Reviewed / Applied / Archived` checkboxes and a ready-to-use propose prompt
  - the ordered Later list
- **Replace the template `openspec/config.yaml`** with project configuration:
  - `context`: app summary, key product decisions, stack, structure rules, the Rp 0 production constraint, and the language rule
  - `rules` for `proposal`, `design`, and `tasks`
  - `operations` guidance for `apply` and `archive`, including when to tick `ROADMAP.md`
- No app code, dependencies, Expo project, or Supabase project are created. Those start in `setup-project-foundation`.

## Capabilities

### New Capabilities

None. This change only adds project documentation and OpenSpec workflow configuration. It introduces no system behavior, so the change opts out of specs (`skip_specs: true`).

### Modified Capabilities

None.

## Impact

- **New files:** `STRUCTURE.md` and `ROADMAP.md` at the repository root.
- **Modified file:** `openspec/config.yaml`. From now on, its `context` and `rules` are injected into every OpenSpec artifact, and its `operations` guidance shapes every apply and archive run.
- **No runtime impact:** no app code, APIs, dependencies, or infrastructure change.
- **Git:** the repository has no commits yet. These files are committed as part of the initial commit at the start of `setup-project-foundation`, where the branch and PR workflow is introduced.
