# Task Pack: Reader Knowledge

## Mục tiêu và mockup

Hoàn thiện trang kiến thức. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/vi-vn/knowledge`, `/en-us/knowledge`
- Chỉ sửa: `apps/web/src/features/reader/knowledge`
- Adapter: `apps/web/src/features/reader/knowledge/adapter.ts`
- Cấm sửa: UI kit, contracts, API, root config

## Prompt

```text
Đọc AGENTS.md và task pack reader-knowledge. Hoàn thiện taxonomy, cards và responsive chỉ trong feature reader/knowledge.
```

## Acceptance và verify

- [ ] UI có taxonomy và trạng thái rỗng rõ ràng.
- [ ] Chạy `pnpm typecheck && pnpm build && pnpm test:e2e`.
- [ ] Đính kèm screenshot desktop/mobile.

