# Hướng Dẫn Vibe Coding

## Cách bắt đầu

Mở Codex hoặc Claude Code tại root repo và gửi prompt:

```text
Đọc AGENTS.md và docs/tasks/<task-pack>.md.
Thực hiện đúng scope của task pack.
Trước khi sửa, liệt kê assumptions và file dự kiến chạm.
Sau khi sửa, chạy các lệnh verify được yêu cầu và review diff.
```

## Quy tắc thực dụng

- Đính kèm mockup vào prompt.
- Yêu cầu AI đọc feature hiện có trước khi sửa.
- Chỉ giao một task cho một branch.
- Khi AI muốn sửa shared path, dừng lại và tách thành ticket core riêng.
- Không yêu cầu AI “làm đẹp toàn bộ project” trong branch feature.

## Prompt sửa UI

```text
Task: <tên task>.
Mockup: <ảnh hoặc mô tả>.
Chỉ sửa folder: <allowed path>.
Dùng UI kit hiện có trong apps/web/src/components/ui.
Giữ đủ loading, empty, error và responsive state.
Không đổi contracts, backend hoặc root config.
```

## Prompt review trước PR

```text
Đọc skills/cmsauto-pr-review/SKILL.md.
Review diff hiện tại theo scope của task pack.
Kiểm tra file ngoài scope, responsive, state UI và lệnh verify.
```

