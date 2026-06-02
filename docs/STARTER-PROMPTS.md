# Prompt Khởi Đầu Cho Team

Tài liệu này dành cho người nhận task nhưng không cần biết code sâu. Mỗi task làm trên một branch riêng. Không gửi prompt kiểu "làm đẹp toàn bộ project".

## Trước Khi Chat Với AI

1. Clone repo và tạo branch theo `docs/HANDOFF.md`.
2. Xác định đúng task pack trong `docs/tasks/`.
3. Đính kèm ảnh mockup nếu task có UI.
4. Copy một prompt bên dưới và thay phần trong dấu `<...>`.

## Prompt Dùng Cho Hầu Hết Task UI

```text
Tôi đang làm task: <tên task>.
Task pack: docs/tasks/<task-pack>.md
Mockup: <đính kèm ảnh hoặc mô tả rõ màn hình>.

Hãy đọc AGENTS.md, CLAUDE.md và task pack trước khi sửa code.
Trước khi code:
1. Tóm tắt mục tiêu task.
2. Liệt kê file được phép sửa và file bị khóa.
3. Đọc code hiện tại trong feature folder.
4. Nêu ngắn các thay đổi dự kiến.

Sau đó implement hoàn chỉnh trong đúng scope:
- Giữ style hiện có, dùng Tailwind và UI kit shared.
- Giữ loading, empty, error state.
- Kiểm tra responsive desktop/mobile.
- Không sửa API, contracts, database, UI kit hoặc root config nếu task pack không cho phép.
- Không hardcode logic trong route page.tsx.

Cuối cùng:
1. Chạy lệnh verify trong task pack.
2. Review git diff để tìm file ngoài scope.
3. Báo file đã sửa, kết quả verify và các điểm tôi cần test tay.
```

## Prompt Làm UI Từ Scaffold Mock

Dùng cho dashboard, keyword research và các reader page chưa nối API thật.

```text
Tôi đang làm task scaffold UI: <tên task>.
Task pack: docs/tasks/<task-pack>.md
Mockup: <đính kèm ảnh>.

Đọc AGENTS.md và task pack. Chỉ sửa feature folder được giao.
Dùng model.ts, mock.ts và adapter.ts hiện có. Nếu cần dữ liệu mới, mở rộng typed mock trong feature folder.
Không nối API thật, không sửa backend và không sửa shared contract.

Implement UI hoàn chỉnh theo mockup, có loading, empty, error và responsive state.
Sau khi xong chạy verify trong task pack, review diff và báo điểm cần test tay.
```

## Prompt Sửa Bug Trong Một Feature

```text
Tôi cần sửa bug: <mô tả thao tác gây lỗi>.
Kết quả hiện tại: <điều đang xảy ra>.
Kết quả mong muốn: <điều phải xảy ra>.
Route: <route>.
Task pack liên quan: docs/tasks/<task-pack>.md

Đọc AGENTS.md, task pack và code hiện tại trước khi sửa.
Tìm nguyên nhân gốc trong đúng feature boundary. Chỉ sửa file tối thiểu cần thiết.
Không refactor ngoài scope. Không sửa shared path nếu chưa giải thích vì sao bắt buộc.
Sau khi sửa chạy lint, typecheck và verify phù hợp. Báo rõ cách tôi test tay lại bug này.
```

## Prompt Làm Logic Core

Chỉ dùng khi ticket ghi rõ được phép sửa API. Không giao prompt này cho task polish UI.

```text
Tôi đang làm ticket core: <tên ticket>.
Task pack: docs/tasks/<core-task-pack>.md
Yêu cầu logic: <mô tả input, output và hành vi mong muốn>.

Đọc AGENTS.md, task pack và các test hiện có trước khi sửa.
Trước khi code:
1. Liệt kê API route, module core và contract liên quan.
2. Xác nhận file nào được phép sửa.
3. Nêu rủi ro tương thích với web hiện tại.

Implement thay đổi nhỏ nhất đạt yêu cầu.
Không sửa UI ngoài scope. Không đổi schema hoặc contract nếu task pack không cho phép.
Thêm hoặc cập nhật test cho hành vi mới.
Chạy handoff:check, lint, typecheck, test và build.
Cuối cùng báo rõ API contract có thay đổi hay không để các branch UI biết có cần cập nhật từ main.
```

## Prompt Tiếp Tục Sau Khi AI Làm Bản Đầu

```text
Giữ nguyên boundary của task pack hiện tại.
Tôi muốn chỉnh thêm:
- <ý 1>
- <ý 2>

Trước khi sửa, kiểm tra git diff hiện tại để không ghi đè thay đổi đã có.
Chỉ sửa phần liên quan. Sau khi xong chạy lại verify phù hợp và báo file đã chạm.
```

## Prompt Kiểm Tra Trước Khi Gửi PR

```text
Đọc skills/cmsauto-pr-review/SKILL.md và task pack đang làm.
Review toàn bộ diff trên branch hiện tại so với main.

Kiểm tra:
- Có file ngoài scope hay không.
- Có .env.local, SQLite hoặc artifact hay không.
- Có sửa nhầm shared UI, contracts, database hoặc root config hay không.
- UI có responsive, loading, empty, error state hay không.
- Verify trong task pack đã pass hay chưa.

Nếu có lỗi thì sửa trong scope. Nếu cần sửa shared path thì dừng và báo rõ để tách ticket core.
```

## Chọn Task Pack

| Công việc | Task pack |
| --- | --- |
| Reader trang chủ | `docs/tasks/reader-home-polish.md` |
| Reader giới thiệu | `docs/tasks/reader-about.md` |
| Reader thị trường | `docs/tasks/reader-markets.md` |
| Reader kiến thức | `docs/tasks/reader-knowledge.md` |
| Reader phân tích | `docs/tasks/reader-analysis.md` |
| Reader danh sách bài | `docs/tasks/reader-articles-polish.md` |
| Reader chi tiết bài | `docs/tasks/reader-article-detail-polish.md` |
| Reader search UI | `docs/tasks/reader-search.md` |
| Admin dashboard | `docs/tasks/admin-dashboard.md` |
| Admin Article Factory UI | `docs/tasks/admin-factory-polish.md` |
| Admin danh sách và editor bài | `docs/tasks/admin-articles-polish.md` |
| Admin đăng bài thủ công | `docs/tasks/admin-manual-post.md` |
| Admin internal links UI | `docs/tasks/admin-internal-links-polish.md` |
| Admin keyword research UI | `docs/tasks/admin-keyword-research.md` |
| Admin tài khoản | `docs/tasks/admin-users-polish.md` |
| Logic keyword volume thật | `docs/tasks/core-keyword-volume.md` |
| Logic match internal link | `docs/tasks/core-internal-link-matching.md` |
| API search reader thật | `docs/tasks/core-reader-search-api.md` |

## Khi Nào Phải Dừng Và Báo Người Giao Task

- AI muốn sửa file ngoài boundary.
- AI muốn đổi `packages/contracts`, migration hoặc database.
- Task UI nhưng AI đề xuất sửa backend.
- Có merge conflict sau khi cập nhật branch từ `main`.
- Verify fail vì lỗi nằm ngoài feature folder được giao.
