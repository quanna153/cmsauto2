---
name: cmsauto-feature-work
description: Triển khai một feature CMS Auto trong boundary đã giao. Dùng khi làm task UI, mock adapter hoặc logic feature thuộc một context pack trong docs/tasks.
---

# CMS Auto Feature Work

## Khi nào dùng

- Bắt đầu một task trong `docs/tasks/`.
- Sửa UI hoặc adapter của một feature độc lập.

Không dùng cho migration, contract shared hoặc core store nếu ticket không chỉ định.

## Quy trình

1. Đọc `AGENTS.md` và đúng một context pack.
2. Xác nhận route, allowed folder và locked paths.
3. Đọc feature entrypoint, model, mock và adapter hiện có.
4. Nêu assumptions và file dự kiến sửa.
5. Implement thay đổi nhỏ nhất đạt acceptance criteria.
6. Kiểm tra loading, empty, error và responsive state.
7. Chạy verify trong task pack.
8. Review diff để chắc chắn không có file ngoài scope.

## Common Rationalizations

| Suy nghĩ sai | Thực tế |
| --- | --- |
| “Sửa UI kit sẽ nhanh hơn.” | UI kit là shared path; tạo ticket core riêng. |
| “Hardcode trong page trước rồi dọn sau.” | Route phải mỏng; thay adapter ngay trong task. |
| “Task nhỏ nên bỏ qua mobile.” | Screenshot mobile là bằng chứng bắt buộc. |

## Red Flags

- Diff có file ngoài allowed folder.
- Logic nằm trong `page.tsx`.
- Thêm Bootstrap hoặc CSS override global.
- Không có verify output.

## Verification

- [ ] Acceptance criteria đạt.
- [ ] Không chạm locked paths.
- [ ] `pnpm typecheck` pass.
- [ ] `pnpm build` pass.
- [ ] Có screenshot desktop/mobile cho UI task.

