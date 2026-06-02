# CMS Auto Agent Rules

## Mục tiêu

Giữ mỗi feature độc lập để PR từ Codex hoặc Claude dễ ghép. Đọc context pack trong `docs/tasks/` trước khi sửa code.

## Cấu trúc

- `apps/web`: Next.js admin và reader.
- `apps/api`: Express API và SQLite local.
- `packages/contracts`: contract dùng chung.
- `docs/tasks`: scope chính xác cho từng task.

## Lệnh kiểm tra

```bash
pnpm handoff:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Quy tắc bắt buộc

1. Chỉ sửa folder được phép trong task pack.
2. Không commit `.env.local`, DB, `node_modules`, `.next` hoặc `dist`.
3. Không sửa `packages/contracts`, migration, `apps/api/src/database.ts`, `apps/web/src/components/ui` hoặc root config nếu ticket không ghi rõ.
4. Không thêm Bootstrap. Dùng Tailwind và UI kit hiện có.
5. Không hardcode data trong `page.tsx`; page chỉ import feature entrypoint.
6. Trang scaffold dùng `model.ts`, `mock.ts`, `adapter.ts`; nối API bằng cách thay adapter.
7. Không dùng `dangerouslySetInnerHTML` cho nội dung bài viết.
8. Không gửi versions, status transition hoặc publish state từ client. Autosave article phải dùng `expectedRevision`.
9. Không gom refactor ngoài scope vào PR feature.
10. Chạy verify phù hợp trước khi kết thúc và báo rõ lệnh nào đã pass.

## Quy trình

1. Đọc task pack và file liên quan.
2. Nêu ngắn assumptions và file dự kiến sửa.
3. Làm từng thay đổi nhỏ, kiểm tra sau mỗi lát cắt.
4. Review diff để chắc chắn không chạm shared paths.
5. Hoàn thành checklist PR.

