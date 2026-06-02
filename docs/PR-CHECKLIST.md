# PR Checklist

## Trước khi push

```bash
pnpm handoff:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Với thay đổi UI:

```bash
pnpm test:e2e
```

## Nội dung PR

- Gắn ticket và context pack.
- Liệt kê file đã sửa.
- Xác nhận không sửa shared path ngoài scope.
- Đính kèm screenshot desktop và mobile.
- Ghi lại lệnh verify đã chạy.

