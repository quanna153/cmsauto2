# Task Pack: Admin Articles Polish

## Mục tiêu và mockup

Polish danh sách và fallback editor bài viết. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/admin/articles`, `/admin/articles/[id]`
- Chỉ sửa: `apps/web/src/features/admin/articles`
- API đã khóa: PATCH autosave kèm `expectedRevision`
- Cấm sửa: API, contracts, UI kit, root config

## Prompt

```text
Đọc AGENTS.md và task pack admin-articles-polish. Polish UI nhưng giữ autosave revision và conflict message hiện có.
```

## Acceptance và verify

- [ ] Không gửi server-owned fields từ client; conflict state vẫn rõ.
- [ ] Chạy `pnpm typecheck && pnpm test && pnpm build`.
- [ ] Đính kèm screenshot desktop/mobile.

