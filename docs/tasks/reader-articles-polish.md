# Task Pack: Reader Articles Polish

## Mục tiêu và mockup

Polish danh sách bài reader. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/vi-vn/articles`, `/en-us/articles`
- Chỉ sửa: `apps/web/src/features/reader/articles`
- Dữ liệu: giữ `apps/web/src/features/reader/adapter.ts`
- Cấm sửa: API, contracts, UI kit, root config

## Prompt

```text
Đọc AGENTS.md và task pack reader-articles-polish. Polish article listing theo mockup, không đổi API SSR.
```

## Acceptance và verify

- [ ] Listing desktop/mobile và empty state rõ ràng.
- [ ] Chạy `pnpm typecheck && pnpm build && pnpm test:e2e`.
- [ ] Đính kèm screenshot desktop/mobile.

