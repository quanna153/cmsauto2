# Permission Policy

> Status: `BACKLOG REFERENCE`. Runtime base v1 chỉ khóa hai role `super_admin` và `admin`.

## 1. Mục đích

Tài liệu này chốt chính sách auth và phân quyền rút gọn cho CMS Auto v3. Hệ thống không còn dùng permission matrix chi tiết theo workspace/site ở v1.

## 2. Role hệ thống

Chỉ có 2 role:

- `super_admin`
- `admin`

### `super_admin`

- full app
- quản lý user
- tạo tài khoản mới
- xóa tài khoản
- reset mật khẩu tạm
- revoke toàn bộ session của user khác

### `admin`

- full quyền vận hành CMS:
  - tạo bài
  - sửa bài
  - sửa link
  - duyệt
  - lên lịch
  - publish
  - xem reader/admin
- không được quản lý user

## 3. Nguyên tắc

- Chỉ có đúng `1 super admin` tại một thời điểm.
- `super admin` đầu tiên được bootstrap từ `.env` khi DB chưa có user nào.
- Các tài khoản do `super admin` tạo ra đều là `admin`.
- Tài khoản mới mặc định `must_change_password = true`.
- Reader public không cần auth.
- Toàn bộ admin app và admin APIs đều yêu cầu session hợp lệ.

## 4. Account lifecycle

1. Backend đọc:
   - `BOOTSTRAP_SUPERADMIN_USERNAME`
   - `BOOTSTRAP_SUPERADMIN_PASSWORD`
   - `BOOTSTRAP_SUPERADMIN_FULL_NAME`
2. Nếu DB chưa có user nào, hệ thống tạo đúng 1 `super_admin`.
3. `super_admin` đăng nhập vào `/admin`.
4. `super_admin` vào `Quản lý tài khoản`.
5. Tạo user mới với:
   - `full_name`
   - `username`
   - `email` nếu có
   - `temporary password`
6. User mới đăng nhập lần đầu và bị ép đổi mật khẩu.
7. Nếu user bị xóa hoặc reset password:
   - toàn bộ session hiện có bị revoke.

## 5. API policy

### Public

- `POST /api/session/login`
- `GET /api/published-articles`
- public article detail routes

### Protected cho mọi user nội bộ

- `GET /api/session/me`
- `POST /api/session/logout`
- `POST /api/session/change-password`
- toàn bộ content/link/publish APIs

### Chỉ `super_admin`

- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/users/:id/reset-password`
- `POST /api/users/:id/revoke-sessions`

## 6. Activity log bắt buộc

Mọi mutation sau phải ghi `activity_logs`:

- login thành công
- logout
- create user
- delete user
- reset password
- revoke sessions

## 7. Kết luận

Auth v1 của CMS Auto v3 theo đúng hướng vận hành hiện tại:

- quyền cực gọn
- ít vai trò
- ít UI quyền
- `super_admin` quản lý tài khoản
- `admin` tập trung vận hành nội dung
