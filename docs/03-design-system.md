# Design System

> Status: `CURRENT + TARGET`. Base v1 dùng Tailwind 4, UI kit shared và admin sáng; không thêm Bootstrap.

## 1. Mục tiêu thiết kế

Design system của Autonomous SEO CMS phải phục vụ hai trải nghiệm khác nhau nhưng liên quan chặt chẽ:

- `Admin CMS`: tập trung vào năng suất, mật độ thông tin, thao tác nhanh.
- `Reader Frontend`: tập trung vào readability, tốc độ và khám phá nội dung.

## 2. Nguyên tắc thiết kế

1. Rõ ràng hơn trang trí.
2. Ưu tiên tốc độ thao tác cho team SEO/Content.
3. Reader-facing UI phải dễ đọc trước khi đẹp.
4. Trạng thái hệ thống phải luôn rõ: loading, success, warning, error.
5. Không lạm dụng card lồng card hoặc layout marketing.

## 3. Ngôn ngữ thương hiệu

Từ PRD gốc, visual direction là:

- công nghệ
- hiện đại
- chuyên nghiệp
- dữ liệu rõ ràng
- gợi cảm giác AI automation

Tone chính:

- nền trung tính mạnh
- điểm nhấn vàng/gold
- văn bản rõ tương phản cao

## 4. Color system

## 4.1 Core palette

| Token | Giá trị | Mục đích |
| --- | --- | --- |
| `color.bg.canvas` | `#0F1115` | nền dark shell, top nav, sidebar |
| `color.bg.surface` | `#171A21` | panel dark, modal dark |
| `color.bg.subtle` | `#F5F5F2` | nền light reader/admin content |
| `color.bg.white` | `#FFFFFF` | surface chính |
| `color.text.primary` | `#111827` | text chính trên nền sáng |
| `color.text.secondary` | `#4B5563` | text phụ |
| `color.text.inverse` | `#F9FAFB` | text trên nền tối |
| `color.border.default` | `#E5E7EB` | border light |
| `color.border.dark` | `#2B313D` | border dark |
| `color.brand.gold.500` | `#C8A227` | accent chính |
| `color.brand.gold.600` | `#A88412` | hover/pressed accent |
| `color.brand.gold.100` | `#F5E7B3` | badge/subtle accent |

## 4.2 Semantic colors

| Token | Giá trị | Mục đích |
| --- | --- | --- |
| `color.info` | `#2563EB` | trạng thái thông tin, active filter |
| `color.success` | `#15803D` | publish thành công, health tốt |
| `color.warning` | `#B45309` | draft warning, low confidence |
| `color.danger` | `#DC2626` | lỗi, failed jobs |

## 4.3 Color usage rules

- Gold chỉ dùng làm accent, không dùng làm màu phủ toàn màn hình.
- Admin shell có thể dùng dark chrome + light content area.
- Reader default dùng light mode để tối ưu đọc lâu; dark mode là tùy chọn.
- Tất cả text/body phải đạt tương phản tối thiểu mức AA.

## 5. Typography

## 5.1 Font families

- UI/Admin: `Inter`, fallback `system-ui, sans-serif`
- Article body: `Source Serif 4`, fallback `Georgia, serif`
- Code/Data monospace: `JetBrains Mono`, fallback `ui-monospace`

## 5.2 Type scale

### Admin

| Token | Kích thước | Dùng cho |
| --- | --- | --- |
| `display-sm` | `32/40` | heading chính của trang |
| `h1` | `28/36` | page title |
| `h2` | `22/30` | section title |
| `h3` | `18/26` | panel title |
| `body-md` | `14/22` | text chuẩn |
| `body-sm` | `13/20` | caption, table meta |
| `label` | `12/18` | input label, badge |

### Reader

| Token | Kích thước | Dùng cho |
| --- | --- | --- |
| `article-title` | `40/48` desktop, `28/36` mobile | tiêu đề bài |
| `article-subtitle` | `20/30` | excerpt |
| `article-body` | `19/34` desktop, `18/32` mobile | nội dung bài |
| `article-meta` | `14/22` | tác giả, ngày đăng |

## 5.3 Typography rules

- Không dùng letter-spacing âm.
- Với bài dài, paragraph width nên giữ khoảng `68-76ch`.
- Bài reader phải có line-height thoáng, ưu tiên `1.7-1.8`.

## 6. Layout system

## 6.1 Breakpoints

| Token | Kích thước |
| --- | --- |
| `sm` | `640px` |
| `md` | `768px` |
| `lg` | `1024px` |
| `xl` | `1280px` |
| `2xl` | `1536px` |

## 6.2 Spacing scale

Base spacing:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

## 6.3 Radius

- Button/input: `8px`
- Panel/card nhỏ: `8px`
- Modal/drawer: `10px`

## 6.4 Shell patterns

### Admin shell

- left sidebar cố định
- top header chứa site switcher, search, user menu
- content area light hoặc neutral
- sticky page actions ở phần trên nội dung

### Reader shell

- header gọn
- main article column rộng vừa phải
- aside cho TOC/related content trên desktop
- mobile ưu tiên một cột

## 7. Components

## 7.1 Navigation

- Sidebar navigation
- Top tabs
- Breadcrumb
- Site switcher

## 7.2 Inputs

- Text input
- Textarea
- Rich text editor field
- Keyword chips input
- Select / combobox
- Date time picker
- Toggle
- Checkbox

## 7.3 Actions

- Primary button: gold accent
- Secondary button: neutral outline
- Ghost button: low emphasis
- Danger button: destructive actions

Icon dùng theo hành động:

- generate
- retry
- publish
- schedule
- approve
- reject
- filter
- search

## 7.4 Data display

- Stat blocks
- Table
- Badge/status pill
- Tooltip
- Progress bar
- Trend line / sparkline
- Empty state panel

## 7.5 Content-specific components

- Outline builder
- SEO score meter
- Internal link suggestion list
- Anchor warning badge
- Publish queue row
- Related article module
- Article TOC

## 8. State design

## 8.1 Loading

Ưu tiên:

- skeleton cho dashboard, article list, editor side panels
- inline spinner cho actions ngắn
- progress bar cho AI generation và publish queue

## 8.2 Empty states

Phải có cho:

- chưa có bài viết
- chưa có website
- không có gợi ý internal links
- không có dữ liệu analytics
- không có kết quả tìm kiếm

## 8.3 Error states

Phải hiển thị:

- lỗi AI generate
- lỗi publish
- lỗi CMS credentials
- lỗi load dashboard
- lỗi đồng bộ analytics

Error UX yêu cầu:

- thông điệp ngắn, rõ nguyên nhân
- có nút retry nếu retry được
- có log/reference id nếu cần support

## 9. Bảng trạng thái chuẩn

| Trạng thái | Màu | Ví dụ |
| --- | --- | --- |
| Draft | neutral | bài mới tạo |
| In Review | info | chờ reviewer |
| Published | success | đã live |
| Scheduled | warning | chờ giờ publish |
| Failed | danger | AI/publish lỗi |

## 10. Accessibility

- Contrast đạt WCAG AA.
- Tất cả control có focus state rõ.
- Editor và dashboard dùng được bằng keyboard ở các thao tác chính.
- Không truyền ý nghĩa chỉ bằng màu.
- Reader mode cần hỗ trợ text scaling và dark/light mode rõ ràng.

## 11. Admin page patterns

### Dashboard

- header metric summary
- filter bar
- chart zone
- tables/list insights

### Editor

- main content column
- right rail cho SEO/internal links/settings
- sticky action bar

### Management tables

- search + filters trên cùng
- bulk actions
- row actions rõ ràng

## 12. Reader page patterns

### Homepage

- hero bài nổi bật
- list theo category/cluster
- module bài mới nhất

### Article detail

- title
- meta
- content body
- TOC/aside
- related articles

## 13. Motion

- animation nhanh, tiết chế
- 150-250ms cho hover, drawer, modal
- tránh animation lớn làm chậm dashboard

## 14. Asset strategy

- ưu tiên ảnh thật của bài viết hoặc thumbnail theo nội dung
- icon thống nhất một bộ
- structured data không được phụ thuộc vào trang trí thị giác

## 15. Quy tắc nhất quán

Một component chỉ nên có:

- tên gọi thống nhất
- style thống nhất
- trạng thái thống nhất
- hành vi thống nhất giữa admin và mobile nếu cùng ngữ cảnh
