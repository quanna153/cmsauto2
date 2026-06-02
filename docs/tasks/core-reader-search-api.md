# Task Pack: Core Reader Search API

## Mục tiêu

Tạo API tìm kiếm bài reader thật để thay typed mock adapter sau này.

## Boundary

- Route reader dự kiến: `/api/public/articles/search`
- Được tạo hoặc sửa: module trong `apps/api/src/routes`
- Chỉ sửa khi thật sự cần: `apps/api/src/routes/public-reader.ts`, test liên quan
- Cấm sửa: web UI, contracts, database migration, core store nếu chưa tách ticket riêng

## Quy tắc phối hợp

- API trả dữ liệu ổn định trước khi branch Reader Search UI nối adapter.
- Nếu cần query store mới, xin mở rộng ticket trước khi sửa `apps/api/src/store.ts`.

## Prompt

```text
Đọc AGENTS.md và task pack core-reader-search-api. Implement API search reader trong module route public. Giữ locale vi-vn/en-us, pagination và 404/error behavior rõ ràng. Thêm test và không sửa UI.
```

## Acceptance và verify

- [ ] Search lọc theo locale và query.
- [ ] Pagination có giới hạn hợp lý.
- [ ] Chạy `pnpm handoff:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
