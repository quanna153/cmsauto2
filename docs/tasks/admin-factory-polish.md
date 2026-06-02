# Task Pack: Admin Article Factory Polish

## Mục tiêu và mockup

Polish trải nghiệm tạo bài theo từng bước từ keyword tới bàn giao. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/admin/factory`
- Chỉ sửa: `apps/web/src/features/admin/factory`
- API đã khóa: prompts, keyword suggest, brief, outline, draft, internal links và create article
- Cấm sửa: API, contracts, UI kit, root config

## Prompt

```text
Đọc AGENTS.md và task pack admin-factory-polish. Polish UI workflow nhưng giữ nguyên API hiện có. Không tự chuyển bước khi người dùng đang chọn keyword; chỉ chuyển khi có hành động xác nhận rõ.
```

## Acceptance và verify

- [ ] Workflow từng bước rõ ràng, keyword chính/phụ chọn được trước khi tiếp tục.
- [ ] Prompt inspector, loading, empty, error và responsive state vẫn hoạt động.
- [ ] Chạy `pnpm typecheck && pnpm build`.
- [ ] Đính kèm screenshot desktop/mobile.
