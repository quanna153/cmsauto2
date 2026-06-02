# Task Pack: Reader Markets

## Mục tiêu và mockup

Hoàn thiện trang thị trường từ scaffold. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/vi-vn/markets`, `/en-us/markets`
- Chỉ sửa: `apps/web/src/features/reader/markets`
- Adapter: `apps/web/src/features/reader/markets/adapter.ts`
- Cấm sửa: UI kit, contracts, API, root config

## Prompt

```text
Đọc AGENTS.md và task pack reader-markets. Dùng mock adapter hiện có, hoàn thiện UI thị trường theo mockup và giữ responsive.
```

## Acceptance và verify

- [ ] Có market cards, loading/empty/error state và mobile layout.
- [ ] Chạy `pnpm typecheck && pnpm build && pnpm test:e2e`.
- [ ] Đính kèm screenshot desktop/mobile.

