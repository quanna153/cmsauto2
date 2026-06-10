# Article Image Generation Foundation

> Status: `FOUNDATION`. Đã có scaffold BE/FE và mock provider. Chưa chọn provider thật.

## Mục Tiêu

Thêm khả năng tạo ảnh tự động trong Article Factory sau khi có draft. Feature này phải:

- sinh prompt ảnh từ title, keyword, outline và excerpt;
- gọi provider ảnh bằng API key chính thống hoặc proxy token/cookie nếu team có proxy riêng;
- trả về một contract ổn định để FE preview và lưu vào draft;
- không để frontend gọi thẳng provider bên thứ ba;
- không cần migration DB ở foundation hiện tại.

## Định Hướng Provider

Ưu tiên dùng API key chính thống vì ổn định hơn cookie/proxy token:

| Provider | Khi nên dùng | Ghi chú |
| --- | --- | --- |
| OpenAI Images | Cần chất lượng editorial ổn định và API rõ | Nối trong adapter `openai`. |
| Google Imagen/Gemini | Muốn tận dụng hệ Gemini đang có | Nối trong adapter `gemini`; nên dùng key riêng hoặc biến riêng cho ảnh. |
| Stability AI | Cần style control và model ảnh chuyên dụng | Nối trong adapter `stability`. |
| fal.ai / Replicate | Muốn thử nhiều model như Flux qua marketplace | Nối trong adapter `fal` hoặc `replicate`. |
| Custom proxy | Khi team có cookie/proxy token như Semrush | Dùng provider `custom-proxy`, normalize response về contract chung. |

Nguồn tham khảo chính thức:

- OpenAI image generation: https://platform.openai.com/docs/guides/image-generation
- Google Imagen API: https://ai.google.dev/gemini-api/docs/imagen
- Stability AI API reference: https://platform.stability.ai/docs/api-reference
- Replicate Node.js docs: https://replicate.com/docs/get-started/nodejs
- fal docs: https://fal.ai/docs

## Contract Output

BE trả về:

```ts
type GeneratedArticleImage = {
  id: string;
  kind: "hero" | "inline" | "thumbnail";
  provider: string;
  model: string;
  status: "planned" | "generated" | "failed";
  prompt: string;
  revisedPrompt?: string;
  url?: string;
  base64?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  aspectRatio: "16:9" | "4:3" | "1:1" | "3:4";
  altText: string;
  caption?: string;
  createdAt: string;
};
```

Foundation đang lưu danh sách ảnh trong `draft.generatedImages`. Vì `draft` đã nằm trong `draft_json`, bước này chưa cần sửa migration. Khi cần publish ảnh thật lên CMS media library, core owner có thể tách sang bảng `article_images` hoặc cột JSON riêng.

## Cấu Trúc Đã Thêm

- BE adapter: `apps/api/src/article-images.ts`
- BE route: `POST /api/article-images/generate`
- BE health: `GET /api/health` có `imageProvider` và `imageProviderConfigured`
- FE settings: `/admin/factory` có Image Provider, Image Model, Image API Key, Image Proxy Token
- FE slot: bước `04. Bản nháp` có panel `Ảnh bài viết`
- ENV mẫu: `apps/api/.env.example`
- Test adapter: `apps/api/src/article-images.test.ts`

## ENV

```env
IMAGE_GENERATION_PROVIDER=mock
IMAGE_GENERATION_MODEL=
IMAGE_GENERATION_API_KEY=
IMAGE_GENERATION_PROXY_TOKEN=
IMAGE_GENERATION_BASE_URL=
IMAGE_GENERATION_TIMEOUT_MS=90000
```

Provider hợp lệ ở scaffold:

```text
mock, openai, gemini, stability, replicate, fal, custom-proxy
```

`mock` không gọi API thật. Nó chỉ trả về `status: "planned"` kèm prompt để FE và flow lưu bài chạy được.

`custom-proxy` gửi request:

```http
POST IMAGE_GENERATION_BASE_URL
Authorization: Bearer <IMAGE_GENERATION_API_KEY>        # nếu có
Cookie: proxy_token=<IMAGE_GENERATION_PROXY_TOKEN>      # nếu có
x-proxy-token: <IMAGE_GENERATION_PROXY_TOKEN>           # nếu có
```

Payload proxy:

```json
{
  "model": "IMAGE_GENERATION_MODEL",
  "prompt": "...",
  "aspectRatio": "16:9",
  "kind": "hero",
  "metadata": {
    "language": "vi",
    "primaryKeyword": "...",
    "secondaryKeywords": ["..."],
    "title": "..."
  }
}
```

Proxy hoặc provider thật cần trả về một trong các dạng dễ normalize:

```json
{ "url": "https://..." }
{ "imageUrl": "https://..." }
{ "base64": "..." }
{ "data": [{ "url": "https://..." }] }
{ "images": [{ "url": "https://..." }] }
{ "output": ["https://..."] }
```

## Cách Dev Sau Nối Provider Thật

1. Chọn provider và cập nhật `.env.local`.
2. Mở `apps/api/src/article-images.ts`.
3. Thêm hàm `generateWith<Provider>()`.
4. Trong `generateArticleImage()`, route provider đó vào hàm mới.
5. Không trả raw response thẳng ra FE; luôn normalize thành `GeneratedArticleImage`.
6. Không log API key, proxy token, prompt đầy đủ nếu prompt có dữ liệu nhạy cảm.
7. Nếu provider trả base64, cân nhắc upload media rồi lưu URL trước khi publish.
8. Nếu provider trả URL tạm, cần copy/upload về media storage của CMS trước khi publish thật.

## Vị Trí Trong Article Flow

Luồng đề xuất:

1. Keyword research
2. Brief + competitor insights
3. Outline
4. Draft
5. Generate hero image
6. Internal links
7. Save/review/schedule

Foundation hiện giữ UI tạo ảnh trong bước Draft để không phá 6-step workflow cũ. Khi feature chín hơn, có thể tách thành step riêng `images`.

## Prompt Ảnh Chuẩn

`buildArticleImagePrompt()` đang dùng:

- title;
- primary keyword;
- secondary keywords;
- excerpt;
- outline headings;
- aspect ratio;
- style CoinRadar black/gold/white;
- guardrail: không logo, không fake chart, không lời khuyên đầu tư đọc được.

Dev có thể thêm prompt template riêng sau này nếu cần cho CMS quản lý prompt ảnh.

## Test Cần Có Khi Implement Provider Thật

BE:

- `pnpm --filter @cmsauto/api test -- article-images`
- `POST /api/article-images/generate` với provider thật trả `status: "generated"` và có `url` hoặc `base64`.
- Missing key/proxy trả lỗi rõ, không crash.
- Response không chứa API key/token.

FE:

- `/admin/factory`: generate draft xong bấm `Tạo ảnh hero`.
- Mock mode hiển thị prompt plan.
- Provider thật hiển thị preview ảnh.
- Lưu tạm bài rồi mở lại từ `/admin/articles` vẫn còn `draft.generatedImages`.
- Mobile không overflow panel ảnh.

Publish:

- Nếu chỉ lưu URL ngoài, kiểm tra URL còn sống tại thời điểm publish.
- Nếu cần upload media, thêm bước upload trước khi ghi `published_articles`.
- Reader article detail chỉ render ảnh có alt text.

## Điều Kiện Done Cho Ticket Provider

- Có adapter thật cho ít nhất một provider.
- Có timeout/retry hợp lý.
- Có test mock + missing key + success normalize.
- Có screenshot FE trước/sau tạo ảnh.
- Có hướng dẫn ENV riêng cho provider được chọn.
