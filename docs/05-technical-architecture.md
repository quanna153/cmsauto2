# Technical Architecture - CURRENT

## Snapshot

```text
Admin / Reader
      |
      v
apps/web - Next.js 16, React 19, Tailwind 4
      |
      v
apps/api - Express, Zod
      |
      v
better-sqlite3 - WAL, one backend process
```

## Source Of Truth

- SQLite là source of truth runtime duy nhất.
- Article autosave dùng optimistic concurrency qua `expectedRevision`.
- Client không được gửi ngược versions, transitions hoặc publish state.
- Article library và prompt template cập nhật theo từng resource với revision.

## Reader

- Locale hỗ trợ: `vi-vn`, `en-us`.
- Public API:
  - `GET /api/public/articles?locale=vi-vn&page=1&pageSize=20`
  - `GET /api/public/articles/:locale/:slug`
- Slug unique theo `(locale, slug)`.
- `livePath` luôn là `/${locale}/${slug}`.
- Article detail render server-side và sinh metadata SEO.

## Frontend Boundary

- Route `page.tsx` chỉ import feature entrypoint.
- Shared UI nằm tại `apps/web/src/components/ui`.
- Trang chưa có backend thật dùng typed mock adapter trong feature folder.
- Không dùng Bootstrap hoặc CSS override global.

## Local Database

- DB mặc định: `apps/api/data/cmsauto.sqlite`.
- Không commit DB.
- File DB hỏng làm API fail-fast; hệ thống không ghi đè bằng DB rỗng.

