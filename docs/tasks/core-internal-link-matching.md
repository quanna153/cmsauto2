# Task Pack: Core Internal Link Matching

## Mục tiêu

Phát triển hoặc sửa thuật toán gợi ý và áp dụng internal link mà không trộn với task UI.

## Boundary

- API chính: `POST /api/links/suggest`, `POST /api/links/apply`
- Được sửa: `apps/api/src/factory.ts`
- Chỉ sửa khi thật sự cần: `apps/api/src/index.ts`, test liên quan
- Cấm sửa: database migration, web UI, contracts, root config nếu ticket không ghi rõ

## Quy tắc phối hợp

- Một thời điểm chỉ một branch core sửa thuật toán match link.
- Giữ CRUD article library độc lập với thuật toán match.
- Nếu đổi response suggestion, merge ticket core trước rồi báo branch Factory UI cập nhật từ `main`.

## Prompt

```text
Đọc AGENTS.md và task pack core-internal-link-matching. Sửa thuật toán match hoặc apply internal link trong boundary được phép. Giữ API contract hiện tại nếu ticket không yêu cầu đổi. Thêm test cho anchor, URL và trạng thái accepted/rejected.
```

## Acceptance và verify

- [ ] Chỉ link `accepted` được áp dụng.
- [ ] Không gắn trùng hoặc phá Markdown hiện có.
- [ ] Chạy `pnpm handoff:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
