# Task Pack: Reader Article Detail Polish

## Mục tiêu và mockup

Polish trải nghiệm đọc bài dài. Mockup: đính kèm trong ticket.

## Boundary

- Route: `/vi-vn/[slug]`, `/en-us/[slug]`
- Chỉ sửa: `apps/web/src/features/reader/article`
- Dùng: `apps/web/src/components/reader/article-body.tsx`
- Cấm sửa: renderer Markdown, API, contracts, UI kit nếu ticket không ghi rõ

## Prompt

```text
Đọc AGENTS.md và task pack reader-article-detail-polish. Polish layout đọc bài, TOC và related section; không dùng raw HTML.
```

## Acceptance và verify

- [ ] Readability tốt ở desktop/mobile; Markdown vẫn an toàn.
- [ ] Chạy `pnpm typecheck && pnpm test && pnpm build`.
- [ ] Đính kèm screenshot desktop/mobile.

