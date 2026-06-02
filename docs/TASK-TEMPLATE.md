# Task: <Tên task>

## Mục tiêu

<Một kết quả duy nhất cần đạt.>

## Mockup

<Link hoặc ảnh đính kèm.>

## Scope

- Route: `<route>`
- Chỉ sửa: `<feature-folder>`
- Không sửa: `packages/contracts`, `apps/api/src/database.ts`, `apps/web/src/components/ui`, root config
- Adapter: `<feature-folder>/adapter.ts`

## Prompt khởi đầu

```text
Đọc AGENTS.md và context pack này. Chỉ sửa folder được phép.
Implement UI theo mockup, dùng adapter hiện có và UI kit shared.
Giữ loading, empty, error và responsive state.
```

## Acceptance criteria

- [ ] UI đúng mockup ở desktop.
- [ ] UI usable trên mobile.
- [ ] Không hardcode data trong route.
- [ ] Không chạm shared file ngoài scope.

## Verify

```bash
pnpm typecheck
pnpm build
pnpm test:e2e
```

## Bằng chứng

- [ ] Screenshot desktop.
- [ ] Screenshot mobile.

