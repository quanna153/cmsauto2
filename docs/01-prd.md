# Autonomous SEO CMS PRD

> Status: `TARGET`. Tài liệu mô tả hướng sản phẩm; phạm vi đang chạy xem `docs/05-technical-architecture.md`.

## 1. Tóm tắt sản phẩm

Autonomous SEO CMS là nền tảng CMS ứng dụng AI để tự động hóa workflow SEO content ở quy mô lớn, tập trung vào các website dạng crypto/news, publisher hoặc content platform có nhịp xuất bản nhanh.

Hệ thống bao gồm hai lớp chính:

- Admin CMS cho team SEO, Content, Manager và Admin vận hành.
- Frontend reader-facing để người đọc truy cập nội dung với trải nghiệm đọc tối ưu.

## 2. Bài toán cần giải quyết

Các pain point chính trong PRD gốc:

- Quy trình SEO content đang bị chia nhỏ qua nhiều công cụ.
- Internal linking là khâu tốn nhiều thời gian nhất khi số lượng bài lớn.
- Publish và tracking vẫn phụ thuộc nhiều vào thao tác thủ công.
- Khó scale content mà vẫn giữ chất lượng SEO và sự đồng bộ giữa team.
- Thiếu dashboard tập trung để theo dõi hiệu suất vận hành và hiệu suất SEO.

## 3. Tầm nhìn sản phẩm

Xây dựng một hệ thống vận hành SEO content bán tự động đến tự động, trong đó AI hỗ trợ tạo nội dung, tối ưu SEO, gợi ý internal links, hỗ trợ publish và tạo ra vòng phản hồi analytics tập trung để team có thể scale website với ít nguồn lực hơn.

## 4. Người dùng mục tiêu

| Nhóm người dùng | Mục tiêu chính | Pain point chính |
| --- | --- | --- |
| Content SEO | Tạo bài nhanh, giảm thao tác lặp lại | Tốn thời gian viết, chỉnh meta, publish |
| SEO Executive / SEO Tech | Tối ưu internal links và SEO structure | Khó tìm bài liên quan, dễ spam anchor, khó phát hiện orphan pages |
| SEO Manager / Team Lead | Kiểm soát hiệu suất và quy trình | Thiếu dashboard tập trung, khó quản lý đa website |
| Website Owner | Tăng trưởng organic traffic hiệu quả | Khó nhìn bức tranh vận hành tổng thể |
| Reader / Visitor | Đọc nhanh, dễ hiểu, dễ khám phá bài liên quan | Website chậm, khó đọc, điều hướng kém |

## 5. Giá trị cốt lõi

### Với doanh nghiệp

- Giảm chi phí vận hành SEO/Content.
- Tăng tốc độ scale content.
- Chuẩn hóa workflow SEO trên một hệ thống duy nhất.

### Với team vận hành

- Giảm tác vụ thủ công.
- Tăng độ nhất quán của SEO Onpage và internal links.
- Có dashboard để ra quyết định nhanh hơn.

### Với người đọc

- Nội dung dễ đọc hơn.
- Điều hướng bài liên quan tốt hơn.
- Trải nghiệm tải trang và đọc bài tốt hơn.

## 6. Mục tiêu sản phẩm

### Mục tiêu nghiệp vụ

- Tự động hóa phần lớn workflow SEO content.
- Giảm phụ thuộc vào thao tác thủ công trong internal linking và publish.
- Cho phép quản lý nhiều website trên một hệ thống.

### Mục tiêu vận hành

- Giảm tối thiểu 60% thời gian xử lý internal links.
- Giảm 50% thời gian sản xuất và publish content.
- Scale content gấp 2-3 lần với cùng nguồn lực.

### Mục tiêu SEO

- Tăng internal link coverage.
- Giảm orphan pages xuống dưới 5%.
- Tăng tốc độ index bài mới.
- Tăng organic traffic ổn định theo giai đoạn.

## 7. Làm rõ phạm vi dùng cho bộ tài liệu này

PRD gốc có một số điểm mơ hồ hoặc lệch nhau. Bộ tài liệu chi tiết này sử dụng các giả định làm việc sau:

1. MVP theo hướng `auto-first`: sau khi bài đi qua flow tạo nội dung và internal links, hệ thống ưu tiên tự chạy `review + schedule publish`; human chỉ can thiệp khi bài bị đẩy sang nhánh `cần xử lý` hoặc khi operator chủ động muốn sửa tay.
2. `Multi-site cơ bản` nghĩa là:
   - một workspace quản lý nhiều website;
   - mỗi website có cấu hình publish, taxonomy, analytics riêng;
   - dữ liệu bài viết và internal links không bị lẫn chéo.
3. MVP chỉ cần `internal link suggestion`, chưa bắt buộc auto-insert diện rộng trên live site.
4. Baseline kỹ thuật dùng ngưỡng chặt hơn của NFR:
   - AI generate mục tiêu: dưới 2 phút/bài tiêu chuẩn.
   - Publish mục tiêu: dưới 30 giây.
   - Dashboard mục tiêu: dưới 2 giây cho view chính.

## 8. Những gì sản phẩm làm

## 8.1 Epic 1: AI Content Generation

- Generate outline và draft từ keyword/topic.
- Bổ sung semantic SEO.
- Tạo meta title và meta description.
- Hỗ trợ nhiều template nội dung.
- Có thể tự động tạo FAQ.

## 8.2 Epic 2: Internal Link Automation

- Nhận diện keyword và anchor opportunity.
- Gợi ý internal links theo ngữ cảnh.
- Hỗ trợ auto-insert theo rule ở giai đoạn sau.
- Quản lý anchor distribution.
- Phát hiện orphan pages.
- Cho phép cấu hình link rules.

## 8.3 Epic 3: CMS Publishing System

- Auto review gate để chốt bài trước khi lên lịch.
- Editor/fix screen cho các bài bị đẩy sang `cần xử lý`.
- Publish trực tiếp sang CMS.
- Schedule publish.
- Quản lý multi-site cơ bản.
- Quản lý trạng thái `sẵn sàng duyệt` / `đã lên lịch` / `cần xử lý` / `published`.

## 8.4 Epic 4: SEO Dashboard & Analytics

- SEO dashboard tổng quan.
- Internal link dashboard.
- Content performance tracking.
- SEO health scoring.
- SEO opportunity engine.

## 8.5 Epic 5: Reader Experience & Frontend

- Tối ưu reading experience.
- Dark/Light mode cho reader.
- Responsive reading layout.
- Recommendation sections và related articles.
- Tối ưu Core Web Vitals và cấu trúc SEO frontend.
- Theo dõi reader engagement.

## 9. MVP scope

MVP nên bao gồm:

- User authentication nội bộ theo mô hình `super admin + admin`.
- Multi-site cơ bản.
- AI generate content.
- SEO enrichment cơ bản: semantic SEO + metadata.
- trang tạo bài viết hợp nhất cho admin, bao gồm generate + internal link apply.
- Auto publish sang CMS.
- SEO dashboard tổng quan.

### 9.1 Workflow lõi phải được tối ưu trước

MVP không được tối ưu theo kiểu mỗi nơi một ít tính năng. Workflow quan trọng nhất phải chạy mượt từ đầu đến cuối là:

1. chọn website;
2. nhập topic;
3. hệ thống đề xuất bộ keyword;
4. user chốt `primary keyword` và `secondary keyword set`;
5. hệ thống sinh brief;
6. user review brief/angle;
7. hệ thống sinh outline;
8. user review outline;
9. hệ thống sinh draft;
10. hệ thống sinh internal link suggestions;
11. user review và áp dụng internal links ngay trong flow;
12. hệ thống trả ra bài `sẵn sàng duyệt` đã gắn internal links.

Việc tách các bước `01 -> 05` thành nhiều stage hiển thị riêng là chủ ý thiết kế, không phải phình UI vô ích. Lý do là:

- keyword là điểm ra quyết định chất lượng đầu tiên;
- brief và outline là hai chốt giúp sửa sai sớm trước khi draft dài ra;
- internal links là lớp kiểm soát ngữ cảnh và độ chính xác SEO cuối cùng trước khi bàn giao;
- nếu gộp các điểm này lại thành một cục, user rất khó biết AI sai ở đâu và khó kiểm soát độ chính xác.

Nguyên tắc khóa cho workflow này:

- `Keyword control` là bước ra quyết định rõ ràng, không phải input phụ bị chìm trong form.
- Keyword đã được gợi ý phải được kiểm tra `search volume` qua API provider thật trước khi user chốt.
- `Internal links` là bước review bắt buộc trước publish, không chỉ là widget bên lề.
- Từ bước `Bàn giao` trở đi, flow phải nén lại thành một hành động chính `Duyệt & lên lịch`; không lặp lại keyword/brief/outline review thêm lần nữa.
- Mỗi màn chỉ có `1 hành động chính` ở mỗi thời điểm.
- `Prompt` phải được hiển thị cho người dùng biết hệ thống đang dùng chỉ dẫn gì, và phải sửa được trước khi chạy AI.
- Các control nâng cao khác như rule phức tạp, analytics sâu không được chen vào flow mặc định nếu chưa thật sự cần.

### 9.2 Reader được đẩy sang phase sau

Trong giai đoạn hiện tại, `reader frontend` chưa phải mục tiêu build ưu tiên.

Điều cần đạt trước:

- admin team có thể tạo ra bài viết đã gắn internal links trên một flow duy nhất;
- flow này đủ rõ để người dùng mới nhìn là hiểu phải làm gì tiếp theo;
- output đủ ổn định để hệ thống tự review và tự lên lịch phần lớn bài viết; editor chỉ là nhánh fallback khi bài fail.

### 9.3 Yêu cầu volume keyword cho MVP

Phần keyword của MVP không được dừng ở mức AI suggestion hoặc local estimate.

Yêu cầu tối thiểu:

- mỗi keyword được user nhìn thấy để chọn phải có `monthly search volume`;
- volume phải được lấy từ `API provider thật`, không dùng số giả lập trong staging/UAT;
- kết quả volume check có thể được cache/lưu tạm ở `local DB` trong giai đoạn dev/test, miễn là nguồn số liệu vẫn là provider thật;
- dữ liệu volume phải đi kèm:
  - `provider`;
  - `country`;
  - `language`;
  - `checked_at`;
  - trạng thái `fresh/stale/failed`;
- nếu provider lỗi, UI phải hiển thị rõ là `chưa có volume xác thực`, không được trình bày số ước lượng như số thật;
- user phải có thể sort/filter keyword theo volume khi chốt primary và secondary keywords.

## 10. Ngoài MVP

Các hạng mục nên đẩy sang phase sau nếu cần rút scope:

- Auto insert internal links toàn site.
- Anchor distribution dashboard nâng cao.
- SEO health score nâng cao.
- AI SEO recommendations.
- Topic cluster automation.
- Multi-language content.
- Ad/content balance optimization nâng cao.

## 11. Non-goals hiện tại

Những thứ chưa coi là mục tiêu chính của phiên bản đầu:

- Biến editor thủ công thành đường đi chính của workflow.
- SEO suite toàn diện như Ahrefs/Semrush.
- CMS public dành cho end-user tự tạo tài khoản và viết bài.
- Hệ thống marketing automation cho email/social.
- Tối ưu ads stack hoặc programmatic monetization.

## 12. KPI và success metrics

### Vận hành

- >80% bài mới được tạo và publish qua hệ thống.
- >=90% internal links mới được xử lý qua workflow automation.
- giảm >=60% thời gian xử lý internal links.
- giảm >=50% thời gian sản xuất và publish.

### SEO

- orphan pages <5%.
- tăng internal link coverage.
- tăng tốc độ index bài mới.
- cải thiện topical authority.

### Hệ thống

- AI generate chuẩn <2 phút/bài.
- publish <30 giây.
- dashboard chính <2 giây.
- xử lý ổn định hàng nghìn bài và internal links mỗi ngày.

### Reader experience

- tăng time on page.
- tăng pages/session.
- giảm bounce rate.
- tăng CTR vào related articles.
- cải thiện Core Web Vitals.

## 13. Rủi ro sản phẩm

| Rủi ro | Ảnh hưởng | Hướng xử lý |
| --- | --- | --- |
| AI content chất lượng thấp | Cao | Review gate, scoring, prompt versioning |
| Internal links spam hoặc sai ngữ cảnh | Cao | Rule engine, giới hạn mật độ, review trước publish |
| Hệ thống chậm khi scale | Cao | Queue, caching, background jobs, indexing |
| Third-party API lỗi | Trung bình | Retry, fallback, monitoring |
| Workflow team chưa đồng bộ | Trung bình | Chuẩn hóa flow, dashboard và auth nội bộ đơn giản |

## 14. Định nghĩa thành công của MVP

MVP được coi là thành công khi:

- team có thể tạo bài mới từ topic đến publish trên một hệ thống duy nhất;
- internal link suggestion đủ tốt để giảm đáng kể thao tác thủ công;
- dashboard trả được ảnh vận hành tối thiểu;
- mỗi website có dữ liệu và cấu hình tách biệt;
- publish ổn định, có retry và log khi lỗi.
