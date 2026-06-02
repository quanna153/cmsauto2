# Task Pack: Reader Home Polish

## Mục tiêu và mockup

Polish homepage reader mà không thay API SSR hiện có. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/vi-vn`, `/en-us`
- Chỉ sửa: `apps/web/src/features/reader/home`
- Dữ liệu: dùng `apps/web/src/features/reader/adapter.ts`, không sửa contract
- Cấm sửa: layout locale, API, UI kit, root config

## Prompt

```text
Đọc AGENTS.md và task pack reader-home-polish. Polish homepage chỉ trong reader/home, giữ SSR và API hiện tại.
```

## Acceptance và verify

- [ ] Homepage responsive, không phá locale.
- [ ] Chạy `pnpm typecheck && pnpm build && pnpm test:e2e`.
- [ ] Đính kèm screenshot desktop/mobile.

