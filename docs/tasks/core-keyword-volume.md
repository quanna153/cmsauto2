# Task Pack: Core Keyword Volume

## Mục tiêu

Phát triển hoặc sửa logic lấy search volume thật mà không trộn với task polish UI.

## Boundary

- API chính: `POST /api/keywords/suggest`, `POST /api/keywords/refresh-volume`
- Được sửa: `apps/api/src/keyword-volume.ts`
- Chỉ sửa khi thật sự cần: `apps/api/src/index.ts`, `apps/api/src/store.test.ts`, `.env.example`
- Cấm sửa: database migration, web UI, contracts, root config nếu ticket không ghi rõ

## Quy tắc phối hợp

- Một thời điểm chỉ một branch core sửa logic keyword volume.
- Nếu đổi response contract, merge ticket core trước rồi báo các branch UI cập nhật từ `main`.
- Không commit credential provider.

## Prompt

```text
Đọc AGENTS.md và task pack core-keyword-volume. Sửa logic volume provider trong boundary được phép, giữ response keyword hiện có nếu ticket không yêu cầu đổi contract. Thêm test phù hợp và không commit credential.
```

## Acceptance và verify

- [ ] Provider lỗi có fallback rõ ràng, không làm hỏng keyword suggest.
- [ ] Không lộ API key.
- [ ] Chạy `pnpm handoff:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
