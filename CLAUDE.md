# CMS Auto Claude Rules

Đọc `AGENTS.md` và context pack trong `docs/tasks/` trước khi code.

## Think Before Coding

- Nêu assumptions. Khi yêu cầu mơ hồ, dừng và hỏi.
- Tìm pattern đang có trong đúng feature folder trước khi tạo pattern mới.

## Simplicity First

- Viết lượng code tối thiểu để đạt acceptance criteria.
- Không thêm abstraction, dependency hoặc config ngoài scope.

## Surgical Changes

- Chỉ sửa folder được task pack cho phép.
- Không sửa shared UI, contracts, schema hoặc root config nếu ticket không ghi rõ.
- Xóa orphan do chính thay đổi của bạn tạo ra; không dọn code ngoài scope.

## Goal-Driven Execution

- Chuyển task thành checklist kiểm chứng được.
- Chạy lệnh verify trong task pack và báo kết quả trước khi kết thúc.

