# Feature Boundaries

| Khu vực | Path | Team feature được sửa? |
| --- | --- | --- |
| Reader markets | `apps/web/src/features/reader/markets` | Có |
| Reader knowledge | `apps/web/src/features/reader/knowledge` | Có |
| Reader analysis | `apps/web/src/features/reader/analysis` | Có |
| Reader about | `apps/web/src/features/reader/about` | Có |
| Reader search | `apps/web/src/features/reader/search` | Có |
| Admin dashboard | `apps/web/src/features/admin/dashboard` | Có |
| Admin Article Factory UI | `apps/web/src/features/admin/factory` | Có, chỉ UI |
| Admin articles UI | `apps/web/src/features/admin/articles` | Có, theo ticket |
| Keyword research | `apps/web/src/features/admin/keyword-research` | Có |
| Manual post | `apps/web/src/features/admin/articles/manual-post.tsx` | Theo ticket |
| Reader shared adapter | `apps/web/src/features/reader/adapter.ts` | Core owner |
| UI kit | `apps/web/src/components/ui` | Core owner |
| Contracts | `packages/contracts` | Core owner |
| Database, migrations | `apps/api/src/database.ts` | Core owner |
| Core content store | `apps/api/src/store.ts` | Core owner |
| Keyword volume providers | `apps/api/src/keyword-volume.ts` | Ticket core riêng |
| Article image generation providers | `apps/api/src/article-images.ts` | Ticket core riêng |
| Internal link matching | `apps/api/src/factory.ts` | Ticket core riêng |
| API composition | `apps/api/src/index.ts` | Core owner hoặc ticket ghi rõ |

Khi task cần thay shared path, tạo ticket core riêng trước. Không mở rộng scope âm thầm trong PR feature.

## Quy tắc Làm Song Song

- Mỗi task dùng một branch riêng.
- Task UI trong các feature folder khác nhau có thể làm song song.
- Một module core chỉ giao cho một branch tại một thời điểm.
- Nếu ticket core đổi API contract, merge ticket core trước. Các branch UI liên quan cập nhật từ `main` rồi mới tiếp tục.
- Git xử lý merge file; CI và review vẫn phải kiểm tra xung đột logic.
