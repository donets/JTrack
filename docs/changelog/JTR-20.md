# JTR-20

- Date: 2026-02-25
- Scope: make attachment creation resilient when the app is offline

## What changed

- Added offline attachment staging in web app:
  - new local RxDB collection `pendingAttachmentUploads`
  - offline-selected files are staged locally instead of being dropped
- Updated attachment adapter (`useAttachmentAdapter`) behavior:
  - if offline (or likely network failure), attachment is staged via repository and shown in ticket attachments list as pending
  - online flow keeps existing presign/upload + metadata path
- Added repository method to stage offline attachments (`stageAttachmentUpload`) with:
  - local placeholder `ticketAttachments` document
  - queued file payload in `pendingAttachmentUploads`
- Added sync pre-processing step (`flushPendingAttachmentUploads`) executed at sync start:
  - uploads staged files when connectivity is back
  - patches local attachment with real storage metadata
  - enqueues regular `ticketAttachments` outbox record for server sync
- Updated ticket attachment UI to show pending uploads without broken links.
- Updated architecture/system design docs for deferred attachment upload flow.

## Files

- `apps/web/plugins/rxdb.client.ts`
- `apps/web/composables/useOfflineRepository.ts`
- `apps/web/composables/useAttachmentAdapter.ts`
- `apps/web/stores/sync.ts`
- `apps/web/stores/sync.spec.ts`
- `apps/web/pages/tickets/[id].vue`
- `docs/architecture.md`
- `docs/system-design.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
