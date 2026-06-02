# Page Wireframes

> Status: `BACKLOG REFERENCE`. Nhiều trang mới đang là scaffold typed mock, không phải feature backend hoàn chỉnh.

## 1. Mục đích

Tài liệu này mô tả bố cục và khối chức năng của từng trang chính. Đây là wireframe mức nội dung và cấu trúc, chưa phải mockup pixel-perfect.

## 2. Nguyên tắc chung

- Admin ưu tiên mật độ thông tin cao nhưng dễ scan.
- Mỗi trang có một hành động chính rõ ràng.
- Các trang có bảng luôn cần search, filter, trạng thái và bulk action nếu hợp lý.
- Trên mobile, thứ tự ưu tiên là nội dung chính trước, panel phụ sau.

## 3. Page 1: Login / Access

### Mục tiêu

Cho user nội bộ đăng nhập bằng tài khoản do `super admin` cấp và xử lý được trạng thái đổi mật khẩu lần đầu.

### Bố cục

- Centered auth panel
- Brand/title nhỏ phía trên
- Form đăng nhập

### Thành phần

- Username input
- Password input
- Sign in button
- Error banner
- First-login change-password state

## 4. Page 2: Admin Dashboard

### Mục tiêu

Cho SEO Manager và team vận hành nhìn nhanh tình trạng content, internal links, publish và analytics.

### Desktop layout

```text
[Sidebar] [Topbar: Site Switcher | Search | Date Filter | User]

[Page Title + Quick Actions]
[KPI Row: Articles | Published | Failed Jobs | Orphan Pages]
[Chart Row: Traffic Trend | Publish Trend]
[Insight Row: Internal Link Coverage | Top Linked Pages]
[Table/List Row: Recent Drafts | Failed Publish Jobs]
```

### Thành phần chính

- Site switcher
- Date range filter
- KPI cards
- Line/bar charts
- orphan pages widget
- recent activity feed
- failed jobs panel

### Mobile

- KPI stack theo cột
- chart cuộn ngang hoặc rút gọn
- bảng đổi thành list cards

## 5. Page 3: Article Factory

### Mục tiêu

Nhập topic, chốt keyword plan, sinh draft và áp dụng internal links ngay trên cùng một flow.

### Desktop layout

```text
[Sidebar] [Topbar]

[Page Title]
[Top: Sticky Stepper]
[Left Column: Current Step Input / Review]
[Right Column: Prompt Panel + Output Summary]
[Bottom: Article Preview + Internal Link Apply Result]
```

### Thành phần chính

- topic/keyword input
- keyword recommendation block
- keyword volume table hoặc ranked list
- primary keyword selection
- secondary keyword selection
- content type selector
- tone/audience selector
- keyword cluster summary
- current prompt panel
- prompt version / source label
- quick edit prompt textarea
- reset-to-default prompt action
- brief preview
- outline preview
- draft summary panel
- internal link review list
- apply-links result summary
- stepper / progress state
- next action card

### Hành động chính

- Review keyword set
- Generate brief
- Generate outline
- Generate draft
- Apply internal links

Lưu ý UX:

- Không đặt `review`, `approve`, `publish` trên màn này.
- Prompt phải luôn nhìn thấy được ở bước AI hiện tại, nhưng nằm ở cột phụ để không tranh vai với action chính.
- Prompt edit nên là `progressive disclosure`:
  - mặc định thấy bản rút gọn + version;
  - bấm `Sửa prompt` thì mở textarea đầy đủ.
- Keyword list phải hiển thị rõ các cột:
  - keyword;
  - intent/cluster;
  - monthly search volume;
  - provider;
  - checked_at.
- Nếu volume chưa xác thực được, item đó phải có badge lỗi hoặc trạng thái pending rõ ràng.
- Không nhét history, analytics hoặc settings sâu vào cùng màn generate.

Mục tiêu output của màn này:

- tạo ra bài `sẵn sàng duyệt`;
- đã có internal links được apply;
- các bước trước đó được tách riêng để kiểm soát độ chính xác;
- phần sau của flow được nén lại thành một gate tự động thay vì mở thêm một editor dài dòng.

## 6. Page 4: Review Gate / Auto Schedule

### Mục tiêu

Biến bài viết từ `sẵn sàng duyệt` sang `đã lên lịch` bằng một thao tác chính duy nhất, đồng thời chỉ mở nhánh chỉnh tay khi bài fail.

### Desktop layout

```text
[Sidebar] [Topbar]

[Header: Article Title | Status | Duyệt & lên lịch]
[Main 8 cols: QA Summary + Validation Checklist + Draft Preview]
[Right Rail 4 cols]
  - Review Result
  - Schedule Preview
  - Internal Link Status
  - Failure Reasons
  - Fallback Actions
```

### Thành phần chính

- article identity summary
- primary keyword summary
- metadata validation block
- draft preview
- auto review result card
- publish_at preview
- compact internal link status
- warnings / blockers list
- `Xử lý tay` action khi bài fail

Lưu ý UX:

- Internal link decision chính diễn ra ở `Article Factory`, không lặp lại ở đây.
- Action chính chỉ có `Duyệt & lên lịch`.
- Nếu bài fail, UI mới hé lộ đường đi `Xử lý tay` hoặc `Mở editor`.
- Không biến page này thành một rich editor lớn nếu đa số bài có thể auto pass.

### Mobile

- summary full width
- side panels chuyển thành tabs hoặc drawers
- action bar sticky ở đáy hoặc trên cùng

## 7. Page 5: Internal Link Management

### Mục tiêu

Màn này chưa phải ưu tiên ở phase hiện tại. Ở giai đoạn đầu, internal link review theo bài sẽ nằm trong `Article Factory`; màn quản lý cấp site làm sau khi flow chính đã ổn định.

### Desktop layout

```text
[Sidebar] [Topbar]

[Page Title + Source Article Context]
[Main Review List: Source -> Anchor -> Target]
[Right Rail: Selected Suggestion Detail + Apply Result]
[Footer: Apply Selected Links -> Continue To Review Gate]
```

### Thành phần chính

- source article summary
- source excerpt per suggestion
- target article preview
- reason + confidence
- accept / reject / edit anchor
- apply selected links to draft
- continue to review gate action
- orphan page panel ở mức phụ hoặc tab phụ

### Hành động chính

- Review suggestion
- Accept / Reject
- Edit anchor
- Apply links to draft
- Continue to review gate

## 8. Page 6: SEO Analytics

### Mục tiêu

Theo dõi content performance và internal link performance theo thời gian.

### Desktop layout

```text
[Sidebar] [Topbar]

[Header: Site | Date Range | Export]
[KPI Summary]
[Charts: Traffic | Clicks | Impressions | Index Trend]
[Table: Top Articles]
[Table: Underperforming Articles]
```

### Thành phần chính

- traffic metrics
- content performance table
- filter by category/tag/author
- top linked pages
- underlinked pages
- export CSV/report

## 9. Page 7: Multi-site Management & Settings

### Mục tiêu

Quản lý website, credentials, user nội bộ và cấu hình AI.

### Layout

- Left sub-navigation:
  - Websites
  - CMS Credentials
  - Taxonomy Mapping
  - Users
  - AI Settings
  - Notifications
- Main settings form theo từng tab

### Thành phần chính

- website list
- add/edit website modal
- users table
- create user drawer/modal
- delete user action
- reset password action
- revoke all sessions action
- CMS endpoint + auth settings
- default categories/tags
- prompt/profile settings theo site
- notification settings

## 10. Page 8: Homepage

### Mục tiêu

Cho reader tiếp cận nhanh bài nổi bật và cụm nội dung chính.

### Layout

```text
[Header]
[Hero Featured Story]
[Latest News Grid]
[Category Bands]
[Trending / Recommended]
[Footer]
```

### Thành phần chính

- featured article
- category sections
- latest articles feed
- search entry point
- newsletter/module tùy phase sau

### Mobile

- hero rút gọn
- list một cột
- category sections theo block cuộn dọc

## 11. Page 9: Category Page

### Mục tiêu

Cho reader duyệt bài theo chủ đề hoặc taxonomy.

### Layout

- category header
- filter/sort nhẹ
- article list/grid
- pagination hoặc load more
- sidebar cho related categories trên desktop

### Thành phần chính

- category title + description
- article cards
- breadcrumbs
- sort newest/popular nếu có

## 12. Page 10: Article Detail

### Mục tiêu

Tối ưu trải nghiệm đọc và điều hướng nội dung liên quan.

### Desktop layout

```text
[Header]
[Article Header: Title | Meta | Tags]
[Main Article Column]
[Right Aside: TOC | Related Links]
[End of Article: Related Articles | Next Reads]
[Footer]
```

### Thành phần chính

- title
- author/date/meta
- featured image nếu cần
- article body
- TOC
- inline internal links
- related articles block
- share/save actions nếu dùng

### Mobile

- TOC chuyển thành collapsible section
- aside nhập vào cuối bài hoặc sticky mini-nav
- body chiếm toàn bộ chiều ngang an toàn để đọc

## 13. Page 11: Search Results

### Mục tiêu

Cho reader tìm bài nhanh và chuyển tiếp sang bài liên quan.

### Layout

- search bar top
- result count
- filter nhẹ theo category/date nếu có
- list kết quả

### Thành phần chính

- search input
- article result rows
- snippet/highlight keyword
- empty state khi không có kết quả

## 14. Cross-page panels và modal

Các UI phụ cần nhất quán:

- publish confirmation modal
- failed job detail modal
- article preview modal
- comment/review drawer
- site switcher dropdown
- notification center

## 15. State requirements theo trang

Mọi page cần khai báo tối thiểu:

- loading state
- empty state
- error state
- permission denied state nếu có quyền hạn

## 16. Mapping page -> user

| Trang | User chính |
| --- | --- |
| Login | Tất cả user nội bộ |
| Admin Dashboard | `super admin`, `admin` |
| AI Generate Content | `super admin`, `admin` |
| Review Gate / Fallback Editor | `super admin`, `admin` |
| Internal Link Management | `super admin`, `admin` |
| SEO Analytics | `super admin`, `admin` |
| Multi-site & Settings | `super admin` |
| Homepage/Category/Article/Search | Reader |
