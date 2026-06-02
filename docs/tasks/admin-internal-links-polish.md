# Task Pack: Admin Internal Links Polish

## Mục tiêu và mockup

Polish UI quản lý link dùng chung. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/admin/internal-links`
- Chỉ sửa: `apps/web/src/features/admin/internal-links`
- API đã khóa: CRUD từng item, không PUT toàn danh sách
- Cấm sửa: API, contracts, UI kit, root config

## Prompt

```text
Đọc AGENTS.md và task pack admin-internal-links-polish. Polish UI nhưng giữ CRUD từng item hiện có.
```

## Acceptance và verify

- [ ] Add/delete, loading/empty/error state và responsive vẫn hoạt động.
- [ ] Chạy `pnpm typecheck && pnpm build`.
- [ ] Đính kèm screenshot desktop/mobile.

