# Project Map

## Runtime

```text
Reader / Admin
      |
      v
apps/web (Next.js)
      |
      v
apps/api (Express)
      |
      v
better-sqlite3 local file
```

## Web

- `src/app/admin/*`: route admin; page chỉ import feature.
- `src/app/[locale]/*`: reader SSR cho `vi-vn` và `en-us`.
- `src/features/*`: nơi implement feature.
- `src/components/ui`: UI kit shared, không sửa trong task feature thông thường.

## API

- `src/database.ts`: SQLite connection, WAL và migration.
- `src/routes/public-reader.ts`: public locale API.
- `src/auth-store.ts`: user và session.
- `src/store.ts`: core content workflow, chỉ core owner sửa.

## State

- SQLite là runtime source of truth.
- TanStack Query giữ server state trên web.
- Article autosave gửi `expectedRevision`; conflict trả HTTP `409`.
- `localStorage` không giữ article snapshot.

