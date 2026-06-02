# CMS Auto Base v1

Base project cho CMS nội dung AI và reader tài chính song ngữ. Repo được tổ chức để nhiều người dùng Codex hoặc Claude Code làm feature độc lập và gửi PR dễ review.

## Stack

- Workspace: `pnpm`
- Web: `Next.js 16`, `React 19`, `Tailwind CSS 4`, shadcn/ui-style components
- API: `Express`, `TypeScript`, `better-sqlite3`
- Contracts: `Zod` schemas và TypeScript types dùng chung
- Test: `Vitest`, `Playwright`

## Chạy local

Yêu cầu Node `24` và pnpm `10`.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

- Admin: `http://localhost:5173/admin`
- Reader Việt Nam: `http://localhost:5173/vi-vn`
- Reader English: `http://localhost:5173/en-us`
- API health: `http://localhost:8787/api/health`

DB SQLite được tạo local tại `apps/api/data/cmsauto.sqlite`. Không commit DB hoặc `.env.local`.

## Kiểm tra trước PR

```bash
pnpm handoff:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Bắt đầu task

1. Đọc [AGENTS.md](AGENTS.md).
2. Chọn đúng context pack trong [docs/tasks](docs/tasks).
3. Tạo branch `feat/<ticket-id>-<feature-name>`.
4. Chỉ sửa folder được phép trong task pack.
5. Gửi PR theo [docs/PR-CHECKLIST.md](docs/PR-CHECKLIST.md).

