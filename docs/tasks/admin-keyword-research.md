# Task Pack: Admin Keyword Research

## Mục tiêu và mockup

Hoàn thiện UI nghiên cứu từ khóa từ scaffold. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/admin/keyword-research`
- Chỉ sửa: `apps/web/src/features/admin/keyword-research`
- Adapter: `apps/web/src/features/admin/keyword-research/adapter.ts`
- Cấm sửa API thật nếu ticket chưa ghi rõ contract

## Prompt

```text
Đọc AGENTS.md và task pack admin-keyword-research. Hoàn thiện form, bảng và state bằng typed mock adapter.
```

## Acceptance và verify

- [ ] Có input, result table, loading/empty/error state và mobile layout.
- [ ] Chạy `pnpm typecheck && pnpm build && pnpm test:e2e`.
- [ ] Đính kèm screenshot desktop/mobile.

