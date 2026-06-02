# Task Pack: Reader About

## Mục tiêu và mockup

Hoàn thiện trang giới thiệu thương hiệu. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/vi-vn/about`, `/en-us/about`
- Chỉ sửa: `apps/web/src/features/reader/about`
- Adapter: `apps/web/src/features/reader/about/adapter.ts`
- Cấm sửa: UI kit, contracts, API, root config

## Prompt

```text
Đọc AGENTS.md và task pack reader-about. Hoàn thiện UI theo mockup chỉ trong feature reader/about. Giữ typed adapter và responsive.
```

## Acceptance và verify

- [ ] Có nội dung desktop/mobile, không hardcode trong route.
- [ ] Chạy `pnpm typecheck && pnpm build && pnpm test:e2e`.
- [ ] Đính kèm screenshot desktop/mobile.

