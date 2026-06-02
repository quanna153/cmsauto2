# User Flows

> Status: `TARGET`. Kiểm tra context pack của ticket để biết flow nào đã mở cho team sửa.

## 1. Mục đích

Tài liệu này mô tả luồng người dùng và luồng nghiệp vụ chính của Autonomous SEO CMS. Mỗi flow được viết theo hướng đủ chi tiết để dùng cho design, API, state management và QA.

## 2. Vai trò người dùng

Trong v3 hiện tại chỉ có 2 role hệ thống:

- `super admin`: full app + quản lý tài khoản nội bộ.
- `admin`: full app ở phần CMS, không quản lý tài khoản.

Các persona như `Content Admin`, `Reviewer`, `SEO Executive`... chỉ còn là cách mô tả công việc vận hành, không phải role hệ thống khác nhau.

- `Reader / Visitor`: người đọc nội dung trên frontend public.
- `System`: AI engine, publish service, analytics service.

## 3. Flow 0: Super Admin tạo tài khoản nội bộ

### Mục tiêu

Cho hệ thống bootstrap đúng 1 `super admin` đầu tiên, và cho `super admin` tạo thêm tài khoản nội bộ loại `admin` mà không cần self-signup, Google login hay xác thực email.

### Tiền điều kiện

- Workspace đã tồn tại.
- Nếu DB chưa có user nào thì backend sẽ bootstrap `super admin` đầu tiên từ `.env`.
- `Super admin` đã đăng nhập nếu đang tạo thêm user cho team.

### Luồng chính

1. Nếu DB chưa có user nào, backend đọc:
   - `BOOTSTRAP_SUPERADMIN_USERNAME`
   - `BOOTSTRAP_SUPERADMIN_PASSWORD`
   - `BOOTSTRAP_SUPERADMIN_FULL_NAME`
2. Backend seed đúng 1 tài khoản `super admin`.
3. `Super admin` vào trang `Users`.
4. Bấm `Create User`.
5. Nhập:
   - full name;
   - username;
   - email nếu có;
   - temporary password.
6. Hệ thống tạo `users` với:
   - `role = admin`;
   - `must_change_password = true`;
   - `is_active = true`.
7. Hệ thống tạo audit log cho hành động tạo user.
8. User đăng nhập lần đầu và đổi mật khẩu trước khi vào app.

### Kết quả

- Tài khoản nội bộ mới được tạo.
- Tài khoản mới có full quyền CMS như các admin khác.
- Chỉ `super admin` mới nhìn thấy và thao tác được trang `Users`.
- Có audit log cho hành động tạo user.

### Nhánh lỗi

- Username hoặc email bị trùng -> chặn tạo tài khoản.
- Tài khoản không tồn tại, đã bị xóa hoặc sai mật khẩu -> không cho đăng nhập.

## 4. Flow 1: Từ topic đến bài sẵn sàng duyệt có internal links

### Mục tiêu

Biến một topic thành bài viết sẵn sàng duyệt, đã có keyword plan và internal links được áp dụng.

### Tiền điều kiện

- Người dùng đã đăng nhập với role `admin` hoặc `super admin`.
- Đã chọn website/project.
- Website đã cấu hình ngôn ngữ, category, taxonomy và credentials CMS.

### Luồng chính

1. Content Admin vào trang `AI Generate Content`.
2. Chọn website.
3. Nhập topic hoặc seed keyword.
4. Hệ thống đề xuất:
   - keyword clusters;
   - intent;
   - gợi ý primary keyword;
   - gợi ý secondary keywords.
5. Hệ thống gọi `keyword volume API` để kiểm tra volume cho các keyword được đề xuất theo đúng:
   - country;
   - language;
   - provider hiện hành.
6. Kết quả volume check được lưu tạm vào `local DB` để phục vụ:
   - reload UI;
   - lịch sử run;
   - retry mà không mất context.
7. UI hiển thị cho từng keyword:
   - monthly search volume;
   - provider;
   - checked_at;
   - trạng thái dữ liệu.
8. Người dùng chốt:
   - `primary keyword`;
   - `secondary keyword set`;
   - content type;
   - audience;
   - tone.
9. Hệ thống hiển thị `prompt hiện tại` cho stage `Brief`, gồm:
   - prompt template đang dùng;
   - prompt version;
   - website/profile context quan trọng;
   - vùng chỉnh sửa nhanh nếu user muốn sửa trước khi chạy.
10. Hệ thống tạo research brief dựa trên keyword set đã chốt.
11. Người dùng review brief/angle và có thể chỉnh.
12. Hệ thống hiển thị `prompt hiện tại` cho stage `Outline` và cho phép chỉnh trước khi chạy.
13. Hệ thống tạo outline.
14. Người dùng review outline và có thể chỉnh.
15. Hệ thống hiển thị `prompt hiện tại` cho stage `Draft` và cho phép chỉnh trước khi chạy.
16. Hệ thống generate draft nội dung.
17. Hệ thống bổ sung semantic keywords, metadata và FAQ nếu bật.
18. Hệ thống sinh internal link suggestions cho draft vừa tạo.
19. Người dùng review:
   - source context;
   - anchor;
   - target article;
   - reason;
   - confidence.
20. Người dùng accept, reject hoặc chỉnh suggestion.
21. Hệ thống áp dụng các link đã accept vào draft.
22. Hệ thống lưu bài vào trạng thái `sẵn sàng duyệt` và gắn kèm keyword plan + link decisions đã dùng.

### Kết quả

- Một article sẵn sàng duyệt được tạo.
- Có keyword plan rõ ràng cho bài viết.
- Keyword plan có volume data xác thực theo market đã chọn.
- Có prompt history rõ ràng cho từng stage generate.
- Có internal links đã được apply vào nội dung.
- Có log AI run.
- Có trạng thái generate thành công/thất bại.

### Ghi chú thiết kế luồng

Các bước của `Article Factory` được tách thành nhiều màn hiển thị vì đây là các điểm kiểm soát độ chính xác quan trọng nhất:

- keyword để chốt đúng nhu cầu tìm kiếm và volume thật;
- brief để khóa đúng góc bài trước khi viết;
- outline để kiểm soát cấu trúc;
- internal links để kiểm tra ngữ cảnh SEO trước khi bàn giao.

Từ sau bước `Bàn giao`, hệ thống không nên lặp lại kiểu review dài dòng như giai đoạn generate nữa. Main path ở nửa sau phải là `auto review + auto schedule`, còn chỉnh tay chỉ là fallback.

### Nhánh lỗi

- AI timeout -> cho phép retry.
- Output sai cấu trúc -> đánh dấu failed validation.
- Topic trùng hoặc đã có bài tương tự -> cảnh báo cho người dùng.
- User chưa chốt được primary keyword -> không cho đi tiếp sang brief/draft.
- Volume API lỗi -> hiển thị rõ keyword nào chưa có dữ liệu xác thực và cho phép retry.
- Prompt bị sửa lỗi format hoặc thiếu phần bắt buộc -> cảnh báo trước khi chạy AI.
- Không có internal link phù hợp -> vẫn cho lưu article nhưng phải hiển thị rõ là chưa có link nào được áp dụng.

## 5. Flow 2: Auto review và lên lịch publish

### Mục tiêu

Biến bài viết từ trạng thái `sẵn sàng duyệt` sang `đã lên lịch` bằng một action chính duy nhất.

### Luồng chính

1. Người dùng mở bài ở bước `Bàn giao` hoặc từ `Quản lý bài viết`.
2. UI hiển thị summary gọn:
   - title;
   - keyword chính;
   - số internal links đã gắn;
   - trạng thái metadata;
   - trạng thái hiện tại.
3. Người dùng bấm `Duyệt & lên lịch`.
4. Hệ thống chạy validation bắt buộc:
   - title;
   - slug;
   - meta title/meta description;
   - keyword coverage cơ bản;
   - internal links đã được apply;
   - draft không rỗng và đủ độ dài tối thiểu.
5. Hệ thống chạy `AI/rule-based review` để tạo:
   - quality summary;
   - warnings;
   - pass/fail result.
6. Nếu pass, hệ thống sinh hoặc chọn `publish_at` theo cấu hình site.
7. Hệ thống lưu:
   - review result;
   - review note;
   - status transition;
   - publish schedule.
8. Hệ thống chuyển bài sang trạng thái `đã lên lịch`.

### Kết quả

- Bài viết đi thẳng từ `sẵn sàng duyệt` sang `đã lên lịch` nếu pass.
- Có log review và lý do pass/fail.
- Người dùng chỉ phải ra một quyết định chính ở bước này.

### Nhánh lỗi

- Thiếu trường bắt buộc -> chuyển bài sang `cần xử lý` và hiển thị rõ field nào lỗi.
- AI review score thấp hoặc có cờ rủi ro -> chuyển bài sang `cần xử lý`.
- Site chưa có rule/schedule publish hợp lệ -> chặn lên lịch và hiển thị cấu hình còn thiếu.
- Review service lỗi tạm thời -> cho phép retry, không được âm thầm lên lịch.

## 6. Flow 3: Internal link review theo bài trong Article Factory

### Mục tiêu

Giảm thời gian tìm bài liên quan và biến internal linking thành bước cuối trong flow tạo bài, thay vì một màn phụ tách rời quá sớm.

### Luồng chính

1. Sau khi có draft, người dùng đi sang bước `Internal Links Review` ngay trong `Article Factory`.
2. Hệ thống quét bài hiện tại và nhận diện anchor opportunities.
3. Hệ thống tìm candidate pages theo cùng website.
4. Hệ thống xếp hạng candidate theo:
   - topic relevance;
   - keyword overlap;
   - context trong đoạn văn;
   - freshness;
   - rule constraints.
5. Hệ thống hiển thị từng suggestion theo cấu trúc:
   - source context;
   - anchor text;
   - target article;
   - reason;
   - confidence.
6. Người dùng accept, reject hoặc chỉnh anchor/link.
7. Nếu accept, hệ thống áp dụng ngay vào draft.
8. Sau khi review xong, hệ thống trả article về trạng thái `sẵn sàng duyệt`.

### Kết quả

- Draft được gắn internal links đã duyệt.
- Có dữ liệu để phân tích acceptance rate của suggestion.
- User hiểu rõ vì sao từng link được đề xuất.

### Nhánh lỗi

- Không có page phù hợp -> hiển thị empty state nhưng vẫn cho user tiếp tục bước `Bàn giao`.
- Link trùng đã tồn tại -> chặn insert.
- Anchor quá lặp -> cảnh báo.

## 7. Flow 4: Xử lý tay khi bài bị đẩy sang `cần xử lý`

### Mục tiêu

Cho phép can thiệp tối thiểu khi auto review không đủ tự tin để lên lịch bài viết.

### Luồng chính

1. Bài bị chuyển sang trạng thái `cần xử lý`.
2. Người dùng mở chi tiết bài và xem:
   - lý do fail;
   - field nào thiếu;
   - cảnh báo chất lượng nào đang chặn.
3. Người dùng chọn một trong các hướng xử lý:
   - chỉnh tay field nhỏ;
   - regenerate một section;
   - regenerate lại draft nếu cần.
4. Hệ thống tạo version mới sau khi lưu.
5. Người dùng bấm lại `Duyệt & lên lịch`.
6. Hệ thống chạy lại auto review trên version mới nhất.

### Kết quả

- Có fallback rõ ràng khi auto review fail.
- Không mất lịch sử version trước đó.
- Main path tự động không bị biến thành editor flow mặc định.

## 8. Flow 5: Publish bài viết

### Mục tiêu

Đưa bài viết đã `được lên lịch` lên website đúng taxonomy và trạng thái.

### Luồng chính

1. Bài viết đã có `publish_at` từ bước `Duyệt & lên lịch`.
2. Đến đúng thời điểm, scheduler tạo hoặc kích hoạt `publish job`.
3. Hệ thống validate lại publish payload tối thiểu:
   - title;
   - slug;
   - category/tag mapping;
   - meta fields;
   - internal links đã lưu.
4. Publish service gọi CMS API.
5. CMS trả lại `remote_article_id`, URL live, trạng thái publish.
6. Hệ thống cập nhật article status = `Published`.
7. Người dùng nhận thông báo thành công hoặc thấy log trong article history.

### Nhánh lỗi

- CMS API lỗi -> retry.
- Lỗi mapping category/tag -> đưa job về trạng thái failed review.
- Publish thành công nhưng callback lỗi -> có job reconcile.

## 9. Flow 6: Quản lý multi-site

### Mục tiêu

Cho phép một team vận hành nhiều website trên cùng hệ thống.

### Luồng chính

1. User chọn website từ site switcher.
2. Hệ thống tải:
   - danh sách bài của site;
   - taxonomy;
   - cấu hình AI;
   - publish credentials;
   - dashboard metrics riêng.
3. Mọi thao tác sau đó chỉ áp dụng trong phạm vi website đang active.

### Kết quả

- Không trộn dữ liệu giữa các site.
- Các dashboard, content list và internal links đều có scope theo site.

## 10. Flow 7: SEO Manager theo dõi hiệu suất

### Mục tiêu

Cho phép quản lý nhìn ra sức khỏe vận hành và sức khỏe SEO.

### Luồng chính

1. SEO Manager mở `Dashboard`.
2. Chọn website và khoảng thời gian.
3. Xem:
   - số bài generate/publish;
   - publish success rate;
   - orphan pages;
   - top linked pages;
   - traffic/click/impression;
   - content performance theo category.
4. Drill down vào một bài hoặc cụm bài.
5. Tạo action item:
   - thêm internal links;
   - cập nhật bài;
   - tạo topic mới.

## 11. Flow 8: Reader đọc bài và khám phá nội dung

### Mục tiêu

Tăng time on page và pages/session.

### Luồng chính

1. Reader vào bài từ Google hoặc truy cập trực tiếp.
2. Frontend tải bài viết, metadata SEO, structured data và related articles.
3. Reader đọc nội dung với bố cục tối ưu.
4. Reader click internal links hoặc related articles.
5. Hệ thống tracking:
   - page view;
   - scroll depth;
   - time on page;
   - clicks vào article liên quan.

## 11. Flow 9: Orphan page detection và xử lý

### Mục tiêu

Cho SEO Executive biết bài nào đang bị thiếu internal links.

### Luồng chính

1. SEO Executive vào `Internal Link Dashboard`.
2. Hệ thống hiển thị danh sách orphan pages.
3. User mở một orphan page.
4. Hệ thống gợi ý những bài nên link tới và link từ đâu.
5. User tạo action:
   - cập nhật bài cũ để thêm link;
   - gắn task cho content;
   - auto-insert ở phase sau.

## 12. Flow 10: Analytics feedback loop cho AI

### Mục tiêu

Dùng dữ liệu vận hành và dữ liệu reader để cải thiện nội dung và internal links.

### Luồng chính

1. Hệ thống ingest traffic và engagement metrics định kỳ.
2. Metrics được gắn vào từng article.
3. AI/analytics engine tìm:
   - bài underperforming;
   - bài có CTR hoặc time on page thấp;
   - bài thiếu internal links;
   - cluster có cơ hội mở rộng.
4. Dashboard hiển thị recommendation để team hành động.

## 13. Mapping flow -> trang

| Flow | Trang chính |
| --- | --- |
| Tạo article có links | AI Generate Content / Article Factory |
| Review gate / xử lý tay | Review Gate, Content Editor |
| Internal link suggestion | Article Factory |
| Publish | Review Gate, Publish Queue |
| Multi-site | Site Switcher, Settings |
| Dashboard manager | SEO Dashboard, Analytics |
| Reader journey | Homepage, Category, Article Detail, Search |

## 14. Trạng thái chung cần hỗ trợ

Cho gần như mọi flow admin:

- loading
- empty
- validation error
- API error
- retryable failure
- partial success
- locked by another user

Cho flow publish/AI:

- queued
- processing
- completed
- failed
- retrying
