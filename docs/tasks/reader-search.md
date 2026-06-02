# Task Pack: Reader Search

## Mục tiêu và mockup

Hoàn thiện UI tìm kiếm reader. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/vi-vn/search`, `/en-us/search`
- Chỉ sửa: `apps/web/src/features/reader/search`
- Adapter: `apps/web/src/features/reader/search/adapter.ts`
- Cấm sửa API thật nếu ticket chưa được core owner mở rộng

## Prompt

```text
Đọc AGENTS.md và task pack reader-search. Hoàn thiện search input, result list và empty state bằng typed mock adapter.
```

## Acceptance và verify

- [ ] Có search form, result và empty state responsive.
- [ ] Chạy `pnpm typecheck && pnpm build && pnpm test:e2e`.
- [ ] Đính kèm screenshot desktop/mobile.

