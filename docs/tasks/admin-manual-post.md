# Task Pack: Admin Manual Post

## Mục tiêu và mockup

Hoàn thiện form đăng bài thủ công. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/admin/articles/new`
- Chỉ sửa: `apps/web/src/features/admin/articles/manual-post.tsx`
- Adapter cần tạo trong `apps/web/src/features/admin/articles`
- Cấm sửa article contract hoặc API nếu ticket core chưa mở

## Prompt

```text
Đọc AGENTS.md và task pack admin-manual-post. Hoàn thiện form UI và typed mock adapter trong boundary articles.
```

## Acceptance và verify

- [ ] Form có validation UI, loading/error state và mobile layout.
- [ ] Chạy `pnpm typecheck && pnpm build`.
- [ ] Đính kèm screenshot desktop/mobile.

