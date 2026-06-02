# Task Pack: Admin Users Polish

## Mục tiêu và mockup

Polish màn quản lý tài khoản nội bộ. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/admin/users`
- Chỉ sửa: `apps/web/src/features/admin/users`
- Cấm sửa: auth API, contracts, UI kit, root config

## Prompt

```text
Đọc AGENTS.md và task pack admin-users-polish. Polish UI user management trong đúng boundary, giữ quyền super admin.
```

## Acceptance và verify

- [ ] UI đủ loading/error/responsive và không mở route cho admin thường.
- [ ] Chạy `pnpm typecheck && pnpm build`.
- [ ] Đính kèm screenshot desktop/mobile.

