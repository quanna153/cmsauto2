# Development Process

> Status: `CURRENT`. Với task vibe coding, ưu tiên thêm `AGENTS.md` và context pack trong `docs/tasks/`.

## 1. Mục đích

Tài liệu này định nghĩa cách dự án được triển khai từ lúc chốt phạm vi đến lúc release. Mục tiêu là tránh tình trạng:

- PRD có nhưng team hiểu khác nhau.
- Scope thay đổi liên tục mà không cập nhật tài liệu nền.
- Code đi trước thiết kế và kiến trúc.
- AI feature được làm rời rạc, khó kiểm soát chất lượng.

## 2. Bộ tài liệu chuẩn

Toàn bộ dự án sử dụng bộ tài liệu sau làm nguồn tham chiếu chính:

| File | Mục đích |
| --- | --- |
| `TÀI LIỆU PRODUCT REQUIREMENTS DOCUMENT TEMPLATE.docx` | PRD nguồn ban đầu từ business |
| `docs/01-prd.md` | Bản PRD đã chuẩn hóa, dùng làm source of truth cho team |
| `docs/02-user_flows.md` | Luồng người dùng và luồng nghiệp vụ |
| `docs/03-design-system.md` | Quy ước UI, màu, font, component, trạng thái |
| `docs/04-page-wireframes.md` | Bố cục từng trang, khối nội dung và hành động chính |
| `docs/05-technical-architecture.md` | Kiến trúc hệ thống, stack, dữ liệu, tích hợp |
| `docs/06-ai-design.md` | Thiết kế pipeline AI, prompt, guardrails, đánh giá |
| `docs/07-development-plan.md` | Kế hoạch triển khai theo phase, milestone và backlog |
| `docs/08-permission-matrix.md` | Danh mục permission và preset cấp quyền tham khảo |

## 3. Nguyên tắc làm dự án

1. PRD trước, code sau. Không bắt đầu build khi chưa chốt rõ scope MVP.
2. Human review là bắt buộc ở MVP cho nội dung AI trước khi publish.
3. Làm theo modular monolith + async workers trước, không tách microservice sớm.
4. Ưu tiên feature có tác động trực tiếp đến workflow SEO team: generate content, internal links, publish, dashboard.
5. Mọi thay đổi phạm vi phải cập nhật lại tài liệu liên quan trước khi vào sprint.

## 4. Trình tự thực hiện

### Giai đoạn 1: Chốt sản phẩm

- Đọc và chuẩn hóa PRD.
- Làm rõ các điểm mơ hồ về KPI, phạm vi MVP, vai trò người dùng.
- Viết lại bộ tài liệu chi tiết hơn từ PRD.

Output:

- `01-prd.md`
- `02-user_flows.md`
- `03-design-system.md`
- `04-page-wireframes.md`
- `05-technical-architecture.md`
- `06-ai-design.md`
- `07-development-plan.md`
- `08-permission-matrix.md`

### Giai đoạn 2: Chốt giải pháp

- Chọn kiến trúc tổng thể.
- Chốt data model lõi.
- Chốt luồng AI generation, internal linking, publish.
- Chốt scope admin CMS và frontend reader cho MVP.

Output:

- Danh sách module.
- Danh sách tích hợp bên ngoài.
- Danh sách API/domain model chính.
- Danh sách rủi ro kỹ thuật và phương án kiểm soát.

### Giai đoạn 3: Lập kế hoạch triển khai

- Tách backlog theo epic và milestone.
- Định nghĩa Definition of Ready và Definition of Done.
- Chốt chiến lược test và release.

Output:

- Sprint backlog.
- Milestone checklist.
- Release checklist.

### Giai đoạn 4: Xây dựng

Luồng build chuẩn:

1. Tạo ticket từ backlog đã được chốt.
2. Review yêu cầu và dependency.
3. Thiết kế kỹ thuật ở mức ticket nếu cần.
4. Code + test.
5. Review code.
6. QA/UAT.
7. Merge và deploy.

### Giai đoạn 5: UAT và release

- Chạy test chức năng theo flow chính.
- UAT với team SEO/Content.
- Fix blocker.
- Release production.
- Theo dõi hypercare sau release.

## 5. Trạng thái công việc

Backlog chuẩn:

`Draft -> Ready -> In Progress -> In Review -> QA/UAT -> Done`

Quy tắc:

- `Draft`: mới ghi nhận, chưa đủ thông tin.
- `Ready`: đã rõ scope, acceptance criteria, dependency.
- `In Progress`: đang build.
- `In Review`: chờ review code hoặc review nghiệp vụ.
- `QA/UAT`: đã merge vào môi trường test, chờ kiểm thử.
- `Done`: đã đạt acceptance criteria và không còn blocker mở.

## 6. Definition of Ready

Một ticket chỉ được kéo vào sprint nếu có đủ:

- Mục tiêu nghiệp vụ rõ ràng.
- User flow liên quan đã xác định.
- Acceptance criteria cụ thể.
- Ảnh hưởng tới data/API/UI đã được nêu.
- Không còn dependency blocker chưa xử lý.

## 7. Definition of Done

Một hạng mục chỉ được coi là xong khi:

- Đúng scope theo tài liệu.
- Có test phù hợp với mức độ rủi ro.
- Không phá vỡ flow cũ.
- Có trạng thái loading, empty, error nếu là UI.
- Có logging và xử lý lỗi nếu là backend/AI/integration.
- Được QA/UAT xác nhận với flow chính.
- Tài liệu liên quan được cập nhật nếu hành vi thay đổi.

## 8. Quy tắc thay đổi tài liệu

Khi thay đổi ở một nơi, cần cập nhật tài liệu kéo theo:

- Đổi feature scope: cập nhật `01-prd.md`, `02-user_flows.md`, `07-development-plan.md`.
- Đổi layout hoặc component: cập nhật `03-design-system.md`, `04-page-wireframes.md`.
- Đổi stack, data model, service boundary: cập nhật `05-technical-architecture.md`.
- Đổi workflow AI, prompt, scoring, review gate: cập nhật `06-ai-design.md`.

## 9. Quy trình review

### Review sản phẩm

- Kiểm tra feature có đúng pain point không.
- Kiểm tra scope có đúng phase không.
- Kiểm tra flow có khớp với người dùng mục tiêu không.

### Review thiết kế

- Kiểm tra UI có bám design system không.
- Kiểm tra trang có đủ state không.
- Kiểm tra mobile và desktop có hợp lý không.

### Review kỹ thuật

- Kiểm tra boundary giữa module.
- Kiểm tra dữ liệu có đủ để tracking và audit không.
- Kiểm tra retry, idempotency, logging cho job AI/publish.

## 10. Quy trình release

### Môi trường

- `local`: phát triển cá nhân.
- `staging`: QA/UAT, test tích hợp.
- `production`: release chính thức.

### Checklist trước release

- Flow generate content chạy được.
- Flow review/publish chạy được.
- Internal link suggestion đúng cơ bản.
- Dashboard hiển thị số liệu tối thiểu.
- Quyền truy cập đúng vai trò.
- Tích hợp CMS ngoài hoạt động ổn định.
- Có rollback plan cho publish/integration.

### Hypercare sau release

Theo dõi 24-72 giờ đầu:

- AI error rate
- publish failure rate
- dashboard load time
- queue backlog
- số lượng bài publish thành công
- phản hồi từ team SEO/Content

## 11. Công cụ quản lý đề xuất

- Task management: Linear/Jira/Trello
- Design: Figma
- Docs: Markdown trong repo
- API testing: Postman/Insomnia
- Monitoring: Sentry + logs + metrics dashboard
- QA checklist: Notion/Markdown trong repo

## 12. Kết quả mong đợi của quy trình này

Khi bám đúng quy trình trên, dự án sẽ có:

- Một nguồn sự thật rõ ràng cho product và engineering.
- Phạm vi MVP đủ chặt để build nhanh.
- AI feature có guardrail, không chạy tự phát.
- Quy trình release có kiểm soát, không publish mù.
