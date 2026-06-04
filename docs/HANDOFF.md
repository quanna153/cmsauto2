# Bàn Giao Base v1

## Người giao base

1. Chạy toàn bộ lệnh trong `docs/PR-CHECKLIST.md`.
2. Kiểm tra Git không track `.env.local`, SQLite hoặc artifacts.
3. Tag release base: `base-v1.0.0`.
4. Tạo ticket bằng `docs/TASK-TEMPLATE.md`.
5. Gắn đúng context pack trong `docs/tasks/`.
6. Gửi người nhận link `docs/STARTER-PROMPTS.md`.

## Người nhận task

Nếu chưa từng tạo tài khoản GitHub, đăng nhập Git hoặc push code, đọc `docs/GITHUB-SETUP-AND-PUSH.md` trước.

```bash
git clone https://github.com/quanna153/cmsauto2.git
cd cmsauto2
git checkout -b feat/<ticket-id>-<feature-name>
pnpm install
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

Tài khoản superadmin local dùng chung: `admin` / `1`.

Không chia sẻ `.env.local`. Với task UI mock, chỉ cần chạy web và sửa đúng feature folder.
Nếu chưa biết tạo env, đọc `docs/ENV-SETUP.md` trước khi chạy `pnpm dev`.

Khi mở Codex hoặc Claude, copy prompt phù hợp trong `docs/STARTER-PROMPTS.md` và thay đúng tên task pack được giao.

## Trả bài

1. Chạy verify trong context pack.
2. Chụp desktop và mobile.
3. Push branch, tạo PR vào `main` theo `docs/GITHUB-SETUP-AND-PUSH.md`.
4. Không gửi zip toàn bộ source.
