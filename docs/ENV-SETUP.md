# Hướng Dẫn Setup ENV Cho Team

Tài liệu này dành cho người không biết code sâu. Mục tiêu là chạy được project local mà không làm lộ key thật.

## Quy Tắc An Toàn

- Không gửi `.env.local` cho bất kỳ ai.
- Không commit `.env.local` lên Git.
- Không dán API key thật vào ChatGPT, Codex, Claude hoặc GitHub issue.
- Chỉ gửi key thật qua kênh riêng nếu người đó cần làm task AI/core thật.
- Task UI/mock không cần key thật.

## File ENV Cần Có

Repo đã có sẵn 2 file mẫu:

```text
apps/api/.env.example
apps/web/.env.example
```

Mỗi người tự tạo file local từ file mẫu:

```bash
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

Sau khi copy xong sẽ có:

```text
apps/api/.env.local
apps/web/.env.local
```

## Cách Setup Nhanh

Chạy tại root repo:

```bash
pnpm install
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

Mở:

```text
Admin:  http://localhost:5173/admin
Reader: http://localhost:5173/vi-vn
API:    http://localhost:8787/api/health
```

## Tài Khoản Admin Local

Tài khoản admin được tạo khi API chạy lần đầu và DB local chưa tồn tại. File `apps/api/.env.example` đã chứa sẵn cấu hình bootstrap dùng chung cho local.

Đăng nhập bằng:

```text
Username: admin
Password: 1
```

Đây là tài khoản bootstrap dùng chung để team test local và không bị bắt đổi mật khẩu lần đầu. Tài khoản `admin` khác được tạo trong màn hình quản lý tài khoản vẫn phải dùng mật khẩu tạm tối thiểu 8 ký tự và đổi mật khẩu khi đăng nhập lần đầu.

Nếu muốn đổi username/password local, sửa hai biến sau trong `apps/api/.env.local` trước lần chạy API đầu tiên:

```text
BOOTSTRAP_SUPERADMIN_USERNAME
BOOTSTRAP_SUPERADMIN_PASSWORD
```

Nếu đã chạy project rồi mới sửa ENV, tài khoản cũ vẫn nằm trong SQLite local. Muốn tạo lại theo ENV mới thì xóa DB local:

```bash
rm -rf apps/api/data
pnpm dev
```

Không commit folder `apps/api/data`.

## ENV Của Web

File `apps/web/.env.local` chỉ cần:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787/api
```

Port web đã được khóa ở `5173` trong script `apps/web/package.json`. Không cần thêm `PORT` và không cần sửa nếu chạy local bình thường.

## ENV Của API

File `apps/api/.env.local` tối thiểu giữ như file example:

```text
PORT=8787
CORS_ORIGIN=http://localhost:5173
DATABASE_PATH=./data/cmsauto.sqlite
SESSION_COOKIE_NAME=cms_auto_v3_session
SESSION_TTL_SECONDS=604800
```

Các dòng publish worker giữ mặc định:

```text
PUBLISH_WORKER_POLL_MS=15000
PUBLISH_MAX_RETRIES=3
PUBLISH_RETRY_DELAY_MS=60000
```

## Có Cần GEMINI_API_KEY Không?

Không bắt buộc cho task UI/mock.

Nếu không có key:

- Vẫn chạy admin/reader được.
- Vẫn polish UI được.
- Vẫn làm task mock adapter được.
- Một số bước AI thật có thể dùng fallback/mock hoặc không gọi được AI thật.

Chỉ cần key khi task yêu cầu:

- Article Factory gọi AI thật.
- Prompt thật qua Gemini.
- Test luồng sinh bài bằng AI thật.

Khi cần, người quản lý gửi riêng giá trị cho biến:

```text
GEMINI_API_KEY
```

Người nhận mở `apps/api/.env.local`, tìm dòng `GEMINI_API_KEY` và dán key sau dấu `=`. Giữ model:

```text
GEMINI_MODEL=gemini-2.5-flash
```

Không đưa key này lên GitHub.

## Có Cần Key Tạo Ảnh Không?

Không bắt buộc cho task UI/mock.

Mặc định `apps/api/.env.example` dùng:

```text
IMAGE_GENERATION_PROVIDER=mock
```

Chế độ `mock` không gọi provider thật. Nó chỉ tạo `image plan` gồm prompt, alt text và metadata để team test UI, lưu tạm bài và mở lại bài đang làm dở.

Chỉ cần key/proxy khi task là core article image generation thật. Các biến liên quan:

```text
IMAGE_GENERATION_PROVIDER=mock
IMAGE_GENERATION_MODEL=
IMAGE_GENERATION_API_KEY=
IMAGE_GENERATION_PROXY_TOKEN=
IMAGE_GENERATION_BASE_URL=
IMAGE_GENERATION_TIMEOUT_MS=90000
```

Provider dự kiến:

```text
mock, openai, gemini, stability, replicate, fal, custom-proxy
```

Nếu dùng proxy/cookie token tương tự Semrush, đặt:

```text
IMAGE_GENERATION_PROVIDER=custom-proxy
IMAGE_GENERATION_BASE_URL=<proxy-url>
IMAGE_GENERATION_PROXY_TOKEN=<proxy-token>
```

Chi tiết cho dev nối provider thật nằm ở:

```text
docs/09-article-image-generation.md
docs/tasks/core-article-image-generation.md
```

## Có Cần Key Search Volume Không?

Không bắt buộc cho task UI/mock.

Chỉ cần khi task là core keyword volume thật.

Các biến liên quan:

```text
KEYWORD_VOLUME_PROVIDER_ORDER=semrush,ahrefs,keywordtool
KEYWORD_VOLUME_CACHE_TTL_DAYS=30
KEYWORD_VOLUME_COUNTRY=VN
KEYWORD_VOLUME_METRICS_LANGUAGE=vi
```

Provider Semrush:

```text
SEMRUSH_PROXY_TOKEN=<proxy-token>
```

Provider Ahrefs:

```text
AHREFS_API_KEY
```

Provider KeywordTool:

```text
KEYWORDTOOL_API_KEY
KEYWORDTOOL_ENGINE=google
```

Nếu không được giao task core keyword volume thì để trống các dòng này.

## Theo Loại Task

| Loại task | Cần setup gì |
| --- | --- |
| Reader UI | Copy 2 file `.env.example` là đủ |
| Admin UI | Copy 2 file `.env.example` là đủ |
| Article Factory UI | Copy 2 file `.env.example`; key Gemini chỉ cần nếu test AI thật |
| Internal Links UI | Copy 2 file `.env.example` là đủ |
| Keyword Research UI | Copy 2 file `.env.example` là đủ |
| Core Gemini/AI | Cần `GEMINI_API_KEY` riêng |
| Core keyword volume | Cần provider key riêng |

## Lỗi Thường Gặp

### 1. Không đăng nhập được admin

Kiểm tra username/password trong:

```text
apps/api/.env.local
```

Nếu đã từng chạy project trước đó, xóa DB rồi chạy lại:

```bash
rm -rf apps/api/data
pnpm dev
```

### 2. Web không gọi được API

Kiểm tra API có chạy không:

```text
http://localhost:8787/api/health
```

Kiểm tra `apps/web/.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787/api
```

### 3. Đổi ENV nhưng app không nhận

Dừng server rồi chạy lại:

```bash
pnpm dev
```

### 4. AI không sinh nội dung thật

Kiểm tra `apps/api/.env.local` đã có giá trị cho biến:

```text
GEMINI_API_KEY
```

Nếu không có key, báo người giao task. Không tự tìm key trên mạng và không commit key.

## Checklist Cho Người Nhận Task

- [ ] Đã chạy `pnpm install`.
- [ ] Đã tạo `apps/api/.env.local`.
- [ ] Đã tạo `apps/web/.env.local`.
- [ ] Không gửi `.env.local` cho người khác.
- [ ] Mở được `http://localhost:5173/admin`.
- [ ] Mở được `http://localhost:8787/api/health`.
- [ ] Biết task của mình có cần key thật hay không.
