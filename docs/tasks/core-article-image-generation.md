# Task Pack: Core Article Image Generation

## Mục tiêu

Nối provider tạo ảnh thật cho Article Factory dựa trên scaffold hiện có.

## Boundary

- API adapter: `apps/api/src/article-images.ts`
- API route/schema nếu cần: `apps/api/src/index.ts`
- API tests: `apps/api/src/article-images.test.ts`
- FE preview/settings nếu cần: `apps/web/src/features/admin/factory`
- Docs ENV/provider: `docs/09-article-image-generation.md`, `docs/ENV-SETUP.md`
- Không sửa: `packages/contracts`, `apps/api/src/database.ts`, root config nếu không có approval riêng

## Prompt khởi đầu

```text
Đọc AGENTS.md, docs/09-article-image-generation.md và task pack core-article-image-generation.
Nối một provider tạo ảnh thật vào apps/api/src/article-images.ts.
Giữ contract GeneratedArticleImage, không log secret, không để frontend gọi trực tiếp provider bên thứ ba.
```

## Acceptance

- [ ] Provider thật trả `status: "generated"` với `url` hoặc `base64`.
- [ ] Missing key/proxy trả lỗi rõ và không crash.
- [ ] `mock` vẫn chạy cho local UI/test.
- [ ] FE `/admin/factory` preview được ảnh hoặc image plan.
- [ ] Lưu tạm và mở lại bài vẫn giữ `draft.generatedImages`.
- [ ] Không lộ API key/proxy token trong response, console log hoặc artifact.

## Verify

```bash
pnpm --filter @cmsauto/api test -- article-images
pnpm --filter @cmsauto/api typecheck
pnpm --filter @cmsauto/web typecheck
pnpm --filter @cmsauto/web build
```

Nếu đổi UI:

```bash
pnpm --filter @cmsauto/web test:e2e
```

## Bằng chứng

- [ ] Log command pass/fail.
- [ ] Screenshot `/admin/factory` sau khi tạo ảnh.
- [ ] Sample response đã che token/key.
