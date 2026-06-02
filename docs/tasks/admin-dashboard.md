# Task Pack: Admin Dashboard

## Mục tiêu và mockup

Hoàn thiện dashboard KPI, chart mock và activity list. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/admin/dashboard`
- Chỉ sửa: `apps/web/src/features/admin/dashboard`
- Adapter: `apps/web/src/features/admin/dashboard/adapter.ts`
- Cấm sửa: admin shell, UI kit, contracts, API, root config

## Prompt

```text
Đọc AGENTS.md và task pack admin-dashboard. Hoàn thiện dashboard bằng typed mock adapter. Dùng UI kit hiện có, đủ responsive.
```

## Acceptance và verify

- [ ] KPI, chart placeholder và activity list usable trên desktop/mobile.
- [ ] Chạy `pnpm typecheck && pnpm build && pnpm test:e2e`.
- [ ] Đính kèm screenshot desktop/mobile.

