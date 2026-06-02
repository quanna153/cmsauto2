# AI Design

> Status: `CURRENT + TARGET`. Core owner phụ trách workflow AI; task UI không tự đổi prompt contract.

## 1. Mục tiêu

Phần AI trong Autonomous SEO CMS không chỉ để viết bài. Nó phải hỗ trợ toàn bộ vòng đời content ở các khâu:

- research
- outline
- draft generation
- semantic SEO
- metadata
- FAQ
- internal link suggestion
- quality scoring
- optimization feedback

## 2. Nguyên tắc thiết kế AI

1. AI là copilot có kiểm soát, không phải black box publish thẳng.
2. Mọi output quan trọng phải có schema hoặc format rõ.
3. Main path của MVP là `auto review + schedule`; human chỉ là fallback khi bài fail hoặc cần can thiệp đặc biệt.
4. Mỗi AI run phải trace được input, prompt version, output và kết quả sử dụng.
5. Ưu tiên pipeline ổn định và đo được trước khi tối ưu sophistication.

## 3. AI use cases của MVP

## 3.1 Content generation

- tạo research brief
- tạo outline
- tạo draft bài viết
- viết lại section theo feedback

## 3.2 SEO enrichment

- gợi ý semantic keywords
- generate meta title
- generate meta description
- generate FAQ

## 3.3 Internal linking

- detect anchor opportunities
- tìm target article phù hợp
- gợi ý anchor text
- cảnh báo duplicate hoặc spam pattern

## 3.4 Quality control

- score độ hoàn chỉnh bài viết
- score semantic coverage
- phát hiện output lỗi format hoặc quá lặp
- flag nội dung cần review kỹ

## 4. Pipeline AI chính cho một bài viết

```text
Topic Input
  -> Research Brief
  -> Outline
  -> Draft Generation
  -> SEO Enrichment
  -> Internal Link Suggestion
  -> Quality Scoring
  -> Auto Review Gate
  -> Schedule Decision
  -> Publish
```

## 5. Stage-by-stage design

## 5.1 Topic intake

Input:

- keyword chính
- keyword phụ
- volume data của keyword theo market đã chọn
- loại content
- audience
- website/profile
- language
- optional business notes

Output:

- normalized job payload
- content brief seed

## 5.2 Research brief generation

AI tạo:

- search intent giả định
- angle bài viết
- outline direction
- semantic topics cần cover
- candidate FAQs

Lưu ý:

- brief là artifact trung gian, không publish.
- user có thể chỉnh brief trước khi generate outline.
- keyword scoring nên dùng volume data thật như một tín hiệu đầu vào, không chỉ dựa vào AI suggestion.

## 5.3 Outline generation

Output mong muốn:

- H1
- intro direction
- H2/H3 structure
- key points từng section
- CTA hoặc closing intent nếu cần

Validation:

- không lặp section
- structure hợp lý với content type
- đủ độ phủ topic

## 5.4 Draft generation

Yêu cầu:

- viết theo outline đã chốt
- giữ tone theo website profile
- ưu tiên readability
- tránh keyword stuffing
- có thể chia generate theo section để giảm lỗi dài context

Chiến lược thực tế:

- generate từng block thay vì 1 shot quá dài;
- ghép block và chạy pass normalize cuối.

## 5.5 SEO enrichment

Bao gồm:

- semantic keyword suggestions
- meta title
- meta description
- FAQ section
- optional structured data hints

Validation:

- title không quá dài;
- meta chứa keyword chính nhưng không spam;
- FAQ không lạc chủ đề.

## 5.6 Internal link suggestion

Đây là phần AI quan trọng nhất ngoài content generation.

Pipeline đề xuất:

1. Parse content thành đoạn và candidate anchor spans.
2. Lấy danh sách bài cùng website.
3. Rank target pages theo:
   - keyword overlap
   - topic similarity
   - category relevance
   - freshness/priority
   - rule constraints
4. Tạo suggestion:
   - source span
   - anchor text
   - target article
   - confidence
   - reason

Nguyên tắc:

- không lặp target quá dày trong 1 bài;
- không dùng anchor text gượng ép;
- không link vào page bị excluded bởi rule.

## 5.7 Quality scoring

Scoring nên kết hợp rules + AI review:

- outline completeness
- semantic coverage
- readability
- repetition risk
- link naturalness
- publish readiness

Score dùng để:

- quyết định bài có thể auto schedule hay không;
- chỉ ra bài nào cần chuyển sang `cần xử lý`;
- đo chất lượng output theo prompt/model.

## 6. Kiến trúc model logic

Không khóa cứng vào một model duy nhất. Thiết kế theo role:

- Planning/brief model
- Long-form generation model
- SEO/classification model
- Embedding/similarity model nếu dùng semantic matching

Nguyên tắc:

- model đắt chỉ dùng cho chỗ cần chất lượng cao;
- task có cấu trúc đơn giản dùng model nhanh/rẻ hơn;
- mọi model đều đi qua provider adapter.

## 7. Prompt architecture

## 7.1 Prompt layers

Mỗi AI job nên có nhiều lớp context:

1. System prompt:
   - vai trò chung
   - quality bar
   - tone
   - safety rules
2. Website profile prompt:
   - domain
   - audience
   - style guide
3. Task prompt:
   - generate brief / outline / draft / links / metadata
4. Input payload:
   - keyword
   - outline
   - references
   - current article content

## 7.2 Prompt versioning

Cần lưu:

- prompt name
- version
- effective date
- websites áp dụng
- metrics sau khi dùng

Mục đích:

- rollback prompt nếu output xấu;
- so sánh chất lượng giữa phiên bản prompt.

## 7.3 Prompt visibility trong UI

Prompt không chỉ là cấu hình nội bộ. Với sản phẩm này, user vận hành cần nhìn thấy prompt để hiểu AI đang được chỉ dẫn như thế nào.

Quy tắc hiển thị:

1. Mỗi stage AI phải hiển thị `prompt đang dùng`.
2. User phải biết prompt đó đến từ đâu:
   - default system;
   - website profile;
   - bản đã chỉnh tay ở lần chạy hiện tại.
3. User có thể:
   - preview prompt đầy đủ;
   - chỉnh prompt trước khi chạy;
   - reset về mặc định;
   - so sánh bản đang sửa với bản mặc định nếu cần.
4. Prompt editor phải là `secondary panel`, không làm rối action chính của bước.

Metadata tối thiểu nên hiển thị cùng prompt:

- prompt name
- prompt version
- stage hiện tại
- last edited by
- last edited at

## 8. Structured output

Mọi job AI quan trọng nên có schema.

Ví dụ:

- brief JSON
- outline JSON
- metadata JSON
- internal link suggestions JSON
- quality score JSON

Lợi ích:

- validate được output;
- dễ render vào UI;
- giảm lỗi parser ad-hoc.

## 9. Context và dữ liệu đầu vào

Nguồn context chính:

- website profile
- taxonomy của website
- existing articles
- analytics signals
- previous accepted links
- content templates

Cho internal linking, context tối thiểu phải có:

- article title
- excerpt hoặc summary
- category
- primary keywords
- current link count

## 10. Human fallback

MVP vẫn có nhánh human, nhưng không phải main path. Human chỉ cần can thiệp ở các điểm:

- review brief nếu thật sự cần đổi hướng;
- chỉnh outline khi AI lệch ý đồ;
- accept/reject internal links;
- xử lý bài bị auto review fail;
- mở editor khi cần sửa tay trước khi re-run `Duyệt & lên lịch`.

AI không được phép:

- publish trực tiếp không qua `review gate`, log và schedule
- override rule của site mà không có log

## 11. Guardrails

## 11.1 Content guardrails

- chặn output rỗng hoặc quá ngắn
- chặn heading structure sai
- phát hiện repetition bất thường
- phát hiện keyword stuffing
- cảnh báo tone không đúng website

## 11.2 Link guardrails

- max internal links per article
- max same target repetitions
- excluded categories/pages
- no duplicate anchor spans

## 11.3 Operational guardrails

- max retry per AI job
- timeout threshold
- fallback status nếu provider fail
- alert khi failure rate vượt ngưỡng

## 12. Đánh giá chất lượng

## 12.1 Metrics cho content generation

- draft acceptance rate
- reviewer edit distance
- regenerate rate
- average time to approve
- semantic coverage score

## 12.2 Metrics cho internal links

- suggestion acceptance rate
- rejected because wrong context
- duplicate prevention rate
- orphan page reduction

## 12.3 Metrics cho hệ thống AI

- latency
- cost per article
- timeout rate
- invalid output rate
- retry rate

## 13. Logging và traceability

Mỗi AI run nên lưu:

- run id
- article id hoặc target entity
- input summary
- prompt version
- model role
- timing
- token/cost estimate nếu có
- validation result
- reviewer outcome

## 14. Cost strategy

Để giữ chi phí hợp lý:

- chia pipeline thành stage;
- reuse output trung gian;
- tránh regenerate cả bài nếu chỉ cần sửa section;
- cache candidate article summaries cho internal linking;
- chỉ chạy quality scoring sâu khi bài đủ điều kiện vào `review gate`.

## 15. Failure handling

Nếu AI lỗi:

- đánh dấu job failed hoặc retrying;
- hiển thị lý do đơn giản cho user;
- cho phép retry thủ công;
- không làm mất draft cũ.

Nếu output không hợp lệ:

- chạy pass normalize 1 lần;
- nếu vẫn fail, chuyển sang `cần xử lý` với cảnh báo rõ ràng.

## 16. Lộ trình AI theo phase

### MVP

- brief
- outline
- draft
- metadata
- semantic enrichment cơ bản
- internal link suggestion
- quality scoring cơ bản

### Phase 2

- section regeneration tinh hơn
- anchor distribution optimization
- orphan page recommendation
- content refresh recommendation

### Phase 3

- topic cluster automation
- SEO opportunity engine
- multi-language adaptation
- self-improving prompt experiments

## 17. Quyết định AI cần khóa trước khi build

- chọn provider adapter đầu tiên;
- chốt schema output cho từng job;
- chốt website profile format;
- quyết định có dùng embeddings ngay ở MVP hay phase 2;
- chốt score nào là blocker trước publish.
