# Article Factory

Flow thật gọi API AI theo từng bước. Không thêm publish trực tiếp tại màn này; output dừng ở trạng thái `editor_ready`.

Panel `Ảnh bài viết` chỉ gọi `POST /api/article-images/generate` và lưu output vào `draft.generatedImages`.
Provider thật nằm ở `apps/api/src/article-images.ts`; xem `docs/09-article-image-generation.md` trước khi sửa.
