# Task Pack: Admin Manual Post

## Mục tiêu và mockup

Hoàn thiện form đăng bài thủ công để admin nhập tiêu đề và nội dung, lưu nháp,
xem trước theo giao diện Reader, publish ngay ra Reader hoặc đặt lịch đăng.
Mockup: đính kèm trong ticket.

## Boundary

- Route admin: `/admin/articles/new`
- Route reader chịu ảnh hưởng: `/:locale/:slug`
- Được sửa feature admin:
  - `apps/web/src/features/admin/articles/manual-post.tsx`
  - `apps/web/src/features/admin/articles/manual-post-adapter.ts`
- Được sửa core API cho hành vi publish/draft/schedule thủ công:
  - `apps/api/src/index.ts`
  - `apps/api/src/store.ts`
  - `apps/api/src/store.test.ts`
- Được sửa Reader content renderer/style để bài thủ công hiển thị đúng định dạng:
  - `apps/web/src/components/reader/article-body.tsx`
  - `apps/web/src/components/reader/article-body.test.tsx`
  - `apps/web/src/app/globals.css`
- Cấm sửa `packages/contracts`, migration, database adapter, shared UI kit hoặc root config.
- Không commit `.env.local`, SQLite, `.next`, `dist`, `node_modules` hoặc generated artifact.

## API contract

Branch này mở thêm API surface cho admin manual post, không đổi shared package
`packages/contracts`:

- `POST /api/articles/manual`
  - body: `{ title: string; content: string }`
  - lưu nguyên văn title/content và publish ngay ra Reader.
- `POST /api/articles/manual/schedule`
  - body: `{ title: string; content: string; publishAt: string }`
  - lưu nguyên văn title/content, tạo publish job, chưa hiển thị Reader trước khi worker publish.

Các branch UI khác cần biết main có thêm API route mới nhưng không cần cập nhật
contract package.

## Prompt

```text
Đọc AGENTS.md và task pack admin-manual-post. Hoàn thiện form đăng bài thủ công end-to-end trong boundary trên, giữ dữ liệu admin nhập nguyên văn khi lưu/publish.
```

## Acceptance và verify

- [ ] Admin nhập duy nhất tiêu đề và nội dung cho publish thủ công.
- [ ] Publish thủ công lưu nguyên văn title/content vào database và hiển thị ngay trên Reader.
- [ ] Lưu nháp lưu database nhưng không hiển thị Reader.
- [ ] Đặt lịch lưu database và chỉ hiển thị Reader sau khi publish job chạy.
- [ ] Xem trước mở cửa sổ mới và render giống Reader.
- [ ] Editor hỗ trợ ảnh, heading, bold, italic, underline, highlight, link, list, table, undo/redo.
- [ ] Paste nội dung không mất state và parse heading/bold/list/paragraph đúng.
- [ ] Reader render heading hierarchy, list, table, image, highlight, underline, link và TOC đúng.
- [ ] Form có validation UI, loading/error state và mobile layout.
- [ ] Chạy `pnpm handoff:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- [ ] Đính kèm screenshot desktop/mobile.
