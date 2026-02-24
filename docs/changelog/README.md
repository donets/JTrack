# Changelog Workflow

This directory contains delivery notes for completed/in-progress tasks.

## Why this exists

Updating one shared changelog block in `AGENTS.md` caused frequent merge conflicts across parallel branches.
To avoid that, task-level changelog entries are stored here.

## Rules

- Use one file per issue when possible, for example:
  - `JTR-9.md`
  - `JTR-12.md`
- If a change is cross-cutting and not tied to one issue, use a dated file:
  - `2026-02-24-platform.md`
- Keep entries short:
  - date
  - what changed
  - key files/modules
  - verification commands
- `AGENTS.md` should be updated only for process/rule changes, not routine delivery notes.

## Archive

Historical entries previously stored in `AGENTS.md` were moved to:
- `archive-2026-02.md`
