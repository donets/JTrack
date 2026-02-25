# CHORE: Ignore `packages/shared/dist` Artifacts

- Date: 2026-02-25
- Scope: repository hygiene / VCS noise reduction

## Changes
- Added `packages/shared/dist` to root `.gitignore`.
- Removed `packages/shared/dist/*` files from Git tracking (kept locally, no runtime behavior change).
- Updated system design docs to reflect repository artifact hygiene policy.

## Why
- Generated artifacts in `packages/shared/dist` were repeatedly surfacing as incidental working-tree changes and causing unnecessary merge friction across parallel branches.
