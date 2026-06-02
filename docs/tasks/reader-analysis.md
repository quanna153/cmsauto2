# Task Pack: Reader Analysis

## Mục tiêu và mockup

Hoàn thiện trang phân tích. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/vi-vn/analysis`, `/en-us/analysis`
- Chỉ sửa: `apps/web/src/features/reader/analysis`
- Adapter: `apps/web/src/features/reader/analysis/adapter.ts`
- Cấm sửa: UI kit, contracts, API, root config

## Prompt

```text
Đọc AGENTS.md và task pack reader-analysis. Hoàn thiện module analysis theo mockup, giữ adapter và responsive.
```

## Acceptance và verify

- [ ] Có layout desktop/mobile và typed mock data.
- [ ] Chạy `pnpm typecheck && pnpm build && pnpm test:e2e`.
- [ ] Đính kèm screenshot desktop/mobile.

