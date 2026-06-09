# Hướng Dẫn GitHub, Tạo Branch Và Push Code

Tài liệu này dành cho người chưa từng dùng Git hoặc GitHub. Mục tiêu là mỗi người làm task trên một branch riêng, push branch đó lên GitHub và tạo Pull Request để người giao task review.

Không push trực tiếp vào `main`. Không gửi source code bằng file zip.

## 1. Người Giao Task Cần Chuẩn Bị

Mỗi người nhận task cần có quyền push branch lên repo:

1. Yêu cầu người nhận tạo tài khoản GitHub và gửi lại GitHub username.
2. Mở repo `quanna153/cmsauto2` trên GitHub.
3. Vào `Settings` > `Collaborators` > `Add people`.
4. Mời đúng GitHub username của người nhận task.
5. Yêu cầu họ mở email hoặc GitHub notification và chấp nhận lời mời.

Repo public chỉ giúp mọi người clone được code. Nếu chưa được thêm làm collaborator, họ vẫn không push branch lên repo được.

Khi giao task, gửi đủ thông tin theo mẫu:

```text
Task: Làm lại UI quản lý nhân sự
Ticket ID: 23-admin-users-polish
Task pack: docs/tasks/admin-users-polish.md
Branch phải tạo: feat/23-admin-users-polish
Mockup: <link hoặc ảnh>
```

`Ticket ID` chỉ là mã ngắn để đặt tên branch và theo dõi task. Nó không bắt buộc phải là GitHub Issue ID.

## 2. Tạo Tài Khoản GitHub

1. Mở `https://github.com/signup`.
2. Tạo tài khoản bằng email cá nhân.
3. Xác minh email theo hướng dẫn của GitHub.
4. Gửi GitHub username cho người giao task.
5. Chấp nhận lời mời collaborator của repo `quanna153/cmsauto2`.

Không gửi mật khẩu GitHub, mã OTP, mã khôi phục, access token hoặc thông tin `.env.local` cho người khác hay cho AI.

## 3. Cài Git Và GitHub CLI

Mở Terminal trong Cursor hoặc VS Code và kiểm tra:

```bash
git --version
gh --version
```

Nếu máy macOS chưa có:

```bash
brew install git gh
```

Nếu máy Windows chưa có, mở PowerShell:

```powershell
winget install --id Git.Git -e
winget install --id GitHub.cli -e
```

Đóng và mở lại Terminal sau khi cài.

## 4. Khai Báo Tên Và Email Git

Chạy một lần trên máy cá nhân:

```bash
git config --global user.name "Tên của bạn"
git config --global user.email "email-da-xac-minh-tren-github@example.com"
```

Kiểm tra:

```bash
git config --global user.name
git config --global user.email
```

Email nên là email đã xác minh trong GitHub `Settings` > `Emails`.

## 5. Đăng Nhập GitHub An Toàn

Chạy:

```bash
gh auth login
```

Chọn lần lượt:

```text
GitHub.com
HTTPS
Yes, authenticate Git with your GitHub credentials
Login with a web browser
```

Terminal sẽ hiện một mã đăng nhập dùng một lần và yêu cầu mở trình duyệt. Tự nhập mã đó trên trang GitHub rồi bấm cấp quyền.

Không gửi mã đăng nhập, mật khẩu, OTP hoặc token cho AI. AI chỉ được hướng dẫn thao tác, không được đăng nhập thay bạn.

Kiểm tra đã đăng nhập:

```bash
gh auth status
```

## 6. Clone Repo Lần Đầu

Chỉ làm phần này nếu máy chưa có folder project:

```bash
git clone https://github.com/quanna153/cmsauto2.git
cd cmsauto2
git remote -v
```

Sau đó setup project theo:

- `docs/ENV-SETUP.md`
- `docs/HANDOFF.md`

Không clone lại repo cho mỗi task. Một folder repo có thể dùng cho nhiều task, nhưng mỗi task phải có branch riêng.

## 7. Tạo Branch Mới Theo Tên Task

Trước khi bắt đầu task mới:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/<ticket-id>-<feature-name>
```

Ví dụ:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/23-admin-users-polish
```

Kiểm tra branch hiện tại:

```bash
git branch --show-current
```

Tên branch:

- Dùng chữ thường, số và dấu gạch ngang.
- Không dùng dấu tiếng Việt, khoảng trắng hoặc ký tự đặc biệt.
- Task tính năng dùng `feat/<ticket-id>-<feature-name>`.
- Task sửa lỗi dùng `fix/<ticket-id>-<bug-name>`.

Nếu `git branch --show-current` trả về `main`, không bắt đầu sửa code. Hãy tạo branch task trước.

## 8. Kiểm Tra Và Push Code Sau Khi Làm Xong

Đọc task pack và chạy đúng lệnh verify được ghi trong đó. Trước khi commit, luôn chạy:

```bash
git branch --show-current
git status --short
pnpm handoff:check
```

AI cần kiểm tra:

- Đang ở branch task, không phải `main`.
- Chỉ có file trong scope của task.
- Không có `.env.local`, SQLite, `node_modules`, `.next`, `dist` hoặc file secret.
- Lệnh verify trong task pack đã pass.

Chỉ stage file hoặc folder được phép sửa. Ví dụ:

```bash
git add apps/web/src/features/admin/users
git status --short
git commit -m "feat: polish admin users UI"
git push -u origin feat/23-admin-users-polish
```

Không dùng `git add .` nếu chưa kiểm tra kỹ `git status --short`.

Sau lần push đầu tiên, nếu sửa thêm theo review:

```bash
git add <file-hoac-folder-duoc-phep>
git commit -m "fix: address review feedback"
git push
```

## 9. Tạo Pull Request

Sau khi push branch thành công:

```bash
gh pr create --web --base main
```

Trình duyệt sẽ mở trang tạo Pull Request. Kiểm tra:

- Base branch là `main`.
- Compare branch là branch task của bạn.
- Tiêu đề có tên task hoặc ticket ID.
- Nội dung PR theo `docs/PR-CHECKLIST.md`.
- Có screenshot desktop và mobile nếu task thay đổi UI.

Không tự merge PR nếu người giao task chưa review.

## 10. Cập Nhật Branch Khi Main Có Code Mới

Chỉ làm khi người giao task yêu cầu cập nhật code mới từ `main`:

```bash
git status --short
git fetch origin
git merge origin/main
```

Nếu có merge conflict, dừng lại và báo người giao task. Không tự dùng `git reset --hard`, không xóa file và không force push để né conflict.

## 11. Lỗi Thường Gặp

### `Permission denied` hoặc `Repository not found`

- Kiểm tra `gh auth status`.
- Kiểm tra đã chấp nhận lời mời collaborator chưa.
- Gửi GitHub username cho người giao task để kiểm tra quyền.

### `Permission denied (publickey)`

Repo đang dùng SSH trong khi máy chưa setup SSH. Đổi remote về HTTPS:

```bash
git remote set-url origin https://github.com/quanna153/cmsauto2.git
gh auth setup-git
```

### Push vào `main` bị từ chối

Đây là hành vi đúng vì `main` được bảo vệ. Kiểm tra branch:

```bash
git branch --show-current
```

Nếu đang ở `main` nhưng chưa commit, tạo branch task ngay:

```bash
git switch -c feat/<ticket-id>-<feature-name>
```

### Git báo chưa có tên hoặc email

Chạy lại phần `Khai Báo Tên Và Email Git`.

### Git báo `Everything up-to-date`

Kiểm tra:

```bash
git status --short
git log -1 --oneline
git branch --show-current
```

Có thể bạn chưa commit thay đổi hoặc đang push nhầm branch.

### Lỡ stage `.env.local` hoặc file không được phép

Gỡ khỏi vùng chuẩn bị commit:

```bash
git restore --staged <duong-dan-file>
```

Nếu secret đã bị push lên GitHub, báo người giao task ngay để thu hồi và thay secret. Chỉ xóa file sau khi push là chưa đủ.

## 12. Prompt Cho AI Hướng Dẫn Đăng Nhập Và Setup GitHub

Copy prompt này vào Codex hoặc Claude khi chưa biết đăng nhập GitHub:

```text
Bạn đang hỗ trợ tôi setup Git và GitHub cho repo:
https://github.com/quanna153/cmsauto2

Tôi chưa từng dùng GitHub. Hãy hướng dẫn từng bước, mỗi lần chỉ đưa một bước ngắn rồi chờ tôi gửi kết quả trước khi đi tiếp.

Quy tắc bắt buộc:
- Không hỏi, không đọc và không yêu cầu tôi gửi mật khẩu, OTP, recovery code, access token, secret hoặc nội dung .env.local.
- Không đăng nhập thay tôi. Khi cần xác thực trên trình duyệt, hãy dừng để tôi tự thao tác.
- Không dùng sudo, force push, reset --hard, checkout --, xóa branch hoặc push vào main.
- Không sửa source code trong quá trình setup GitHub.
- Ưu tiên GitHub CLI với HTTPS và luồng "Login with a web browser".

Hãy làm theo thứ tự:
1. Kiểm tra hệ điều hành, git --version và gh --version.
2. Nếu thiếu công cụ, hướng dẫn cài Git và GitHub CLI phù hợp với hệ điều hành.
3. Hướng dẫn tôi cấu hình git user.name và user.email.
4. Hướng dẫn tôi chạy gh auth login bằng GitHub.com, HTTPS và browser login.
5. Hướng dẫn tôi kiểm tra gh auth status.
6. Kiểm tra tôi đã có quyền collaborator với repo chưa.
7. Clone repo nếu máy chưa có project.
8. Cuối cùng báo rõ tôi đã sẵn sàng tạo branch task hay chưa.

Nếu gặp lỗi, giải thích lỗi bằng tiếng Việt và đưa cách sửa an toàn. Không bỏ qua lỗi xác thực hoặc quyền truy cập.
```

## 13. Prompt Cho AI Tạo Branch Mới Theo Task

Thay các phần trong dấu `<...>` trước khi gửi:

```text
Tôi được giao task:
- Task: <tên task>
- Ticket ID: <ticket-id>
- Task pack: docs/tasks/<task-pack>.md
- Branch yêu cầu: feat/<ticket-id>-<feature-name>

Hãy đọc AGENTS.md, docs/HANDOFF.md, docs/FEATURE-BOUNDARIES.md và task pack trước.

Hãy hỗ trợ tôi tạo branch task an toàn:
1. Kiểm tra đây có đúng repo quanna153/cmsauto2 không.
2. Kiểm tra git status và branch hiện tại.
3. Nếu có thay đổi chưa commit, dừng và giải thích, không tự xóa thay đổi.
4. Chuyển về main, pull origin/main bằng --ff-only.
5. Tạo đúng branch được yêu cầu.
6. Kiểm tra lại branch hiện tại và báo folder duy nhất tôi được phép sửa.

Không push vào main. Không force push. Không sửa code trong bước này.
```

## 14. Prompt Cho AI Kiểm Tra, Commit, Push Và Tạo PR

Copy prompt này sau khi đã làm xong task:

```text
Tôi đã làm xong task hiện tại. Hãy giúp tôi kiểm tra, commit, push branch và tạo Pull Request.

Trước khi chạy lệnh, hãy đọc:
- AGENTS.md
- docs/PR-CHECKLIST.md
- task pack của branch hiện tại

Quy tắc bắt buộc:
- Không hỏi, không đọc và không hiển thị mật khẩu, token, secret hoặc nội dung .env.local.
- Không push vào main.
- Không force push, reset --hard, checkout --, xóa branch hoặc bỏ qua lỗi verify.
- Không dùng git add . trước khi review git status.
- Chỉ stage file nằm trong scope của task pack.
- Nếu có file ngoài scope, .env.local, SQLite, node_modules, .next, dist hoặc secret thì dừng và báo tôi.
- Nếu có merge conflict hoặc không có quyền push thì dừng và báo tôi, không tự xử lý phá hủy dữ liệu.

Hãy làm theo thứ tự:
1. Kiểm tra remote repo, branch hiện tại và git status.
2. Xác nhận branch không phải main.
3. Review diff và liệt kê file đã sửa.
4. Chạy pnpm handoff:check và các lệnh verify trong task pack.
5. Chỉ khi verify pass, stage đúng file trong scope.
6. Đề xuất commit message ngắn theo dạng feat: hoặc fix:.
7. Commit và push branch hiện tại lên origin bằng -u nếu đây là lần push đầu.
8. Mở trang tạo PR vào main bằng gh pr create --web --base main.
9. Báo lại branch, commit hash, link branch, link PR nếu có và các lệnh verify đã pass.

Nếu thiếu thông tin task pack, hãy tự tìm trong docs/tasks dựa trên feature folder và tên branch trước khi hỏi tôi.
```

## 15. Những Lệnh AI Không Được Tự Ý Dùng

```text
git push origin main
git push --force
git push -f
git reset --hard
git checkout --
git clean -fd
git branch -D
git add .
```

Nếu AI đề xuất một trong các lệnh trên, dừng lại và hỏi người giao task.
