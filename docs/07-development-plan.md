# Development Plan - CURRENT AND BACKLOG

## Current: Base v1

Đã có:

- pnpm workspace;
- admin shell, auth và module route riêng;
- Article Factory, articles, internal links, users;
- reader SSR song ngữ, homepage và article detail;
- Tailwind 4 + shadcn/ui-style kit;
- typed mock scaffold cho các trang giao team;
- SQLite WAL, revision autosave và locale reader API;
- test, CI, Gitleaks và tài liệu bàn giao.

## Backlog giao theo feature branch

1. Reader about polish.
2. Reader markets UI.
3. Reader knowledge UI.
4. Reader analysis UI.
5. Reader search UI và API riêng khi core owner mở contract.
6. Admin dashboard UI.
7. Admin keyword research UI.
8. Admin manual post UI và API riêng khi core owner mở contract.

## Quy tắc mở task

1. Tạo ticket từ `docs/TASK-TEMPLATE.md`.
2. Chọn đúng context pack trong `docs/tasks`.
3. Branch ngắn từ `main`.
4. Một PR chỉ sửa một boundary.
5. Shared contract thay đổi bằng ticket core riêng.

## Definition Of Done

- đúng acceptance criteria;
- không sửa file ngoài scope;
- có loading, empty, error và responsive state nếu là UI;
- verify commands pass;
- screenshot desktop/mobile;
- PR được review trước khi merge.

