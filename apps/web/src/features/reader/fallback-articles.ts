import type { Locale } from "@cmsauto/contracts";

import type { ReaderArticle } from "@/features/reader/model";

type FallbackArticleSeed = {
  excerpt: string;
  markdown: string;
  primaryKeyword: string;
  slug: string;
  title: string;
};

const featuredKnowledgeArticles: FallbackArticleSeed[] = [
  {
    excerpt: "Tìm hiểu Bitcoin từ nền tảng blockchain, nguồn cung giới hạn đến cách nhà đầu tư mới nên tiếp cận tài sản số này.",
    markdown: `Bitcoin là tài sản số phi tập trung đầu tiên, vận hành trên mạng lưới blockchain công khai. Thay vì phụ thuộc vào ngân hàng trung gian, Bitcoin dùng cơ chế đồng thuận để xác nhận giao dịch và bảo vệ lịch sử dữ liệu.

## Bitcoin hoạt động như thế nào?

Mỗi giao dịch được gom vào block, sau đó thợ đào xác thực và thêm vào chuỗi dữ liệu. Khi block đã được xác nhận đủ sâu, việc thay đổi lịch sử gần như không khả thi về mặt chi phí.

## Vì sao nguồn cung giới hạn quan trọng?

Bitcoin có nguồn cung tối đa 21 triệu BTC. Cơ chế halving làm tốc độ phát hành coin mới giảm dần theo thời gian, tạo nên tính khan hiếm có thể kiểm chứng.

## Người mới nên bắt đầu từ đâu?

Hãy hiểu ví cá nhân, private key, phí giao dịch và rủi ro biến động trước khi mua. Không nên đầu tư chỉ vì giá tăng nhanh hoặc vì tâm lý sợ bỏ lỡ cơ hội.`,
    primaryKeyword: "Bitcoin",
    slug: "bitcoin-la-gi-huong-dan-chi-tiet-cho-nguoi-moi",
    title: "Bitcoin là gì? Hướng dẫn chi tiết cho người mới"
  },
  {
    excerpt: "Giải thích các khái niệm hỗ trợ, kháng cự, xu hướng và cách dùng phân tích kỹ thuật một cách có kỷ luật.",
    markdown: `Phân tích kỹ thuật giúp nhà đầu tư đọc hành vi giá thông qua biểu đồ, khối lượng và các vùng phản ứng quan trọng. Đây không phải công cụ dự đoán chắc chắn, mà là cách xây dựng kịch bản giao dịch có xác suất.

## Hỗ trợ và kháng cự

Hỗ trợ là vùng giá nơi lực mua thường xuất hiện. Kháng cự là vùng giá nơi lực bán có thể tăng lên. Khi các vùng này bị phá vỡ rõ ràng, vai trò của chúng có thể đảo chiều.

## Xu hướng thị trường

Xu hướng tăng thường tạo đỉnh cao hơn và đáy cao hơn. Xu hướng giảm thường tạo đỉnh thấp hơn và đáy thấp hơn. Việc nhận diện xu hướng giúp tránh giao dịch ngược dòng quá sớm.

## Quản trị rủi ro

Một setup đẹp vẫn có thể thất bại. Luôn xác định điểm vô hiệu kịch bản, khối lượng vào lệnh và mức lỗ tối đa trước khi giao dịch.`,
    primaryKeyword: "Phân tích kỹ thuật",
    slug: "phan-tich-ky-thuat-co-ban-ho-tro-khang-cu-va-xu-huong",
    title: "Phân tích kỹ thuật cơ bản: Hỗ trợ, kháng cự và xu hướng"
  },
  {
    excerpt: "Tổng quan về DeFi, AMM, lending, stablecoin, yield farming và các rủi ro cần hiểu trước khi tham gia.",
    markdown: `DeFi là hệ sinh thái tài chính phi tập trung chạy trên blockchain. Người dùng có thể swap token, cho vay, vay, cung cấp thanh khoản hoặc tham gia các chiến lược tạo lợi suất mà không cần trung gian truyền thống.

## AMM và thanh khoản

AMM cho phép giao dịch thông qua pool thanh khoản. Người cung cấp thanh khoản nhận phí giao dịch nhưng cũng chịu rủi ro như impermanent loss và biến động giá tài sản.

## Lending và yield farming

Các giao thức lending cho phép gửi tài sản để nhận lãi hoặc vay bằng tài sản thế chấp. Yield farming thường kết hợp nhiều giao thức để tối ưu lợi suất, nhưng rủi ro smart contract và thanh khoản tăng theo độ phức tạp.

## Điều cần nhớ

Lợi suất cao luôn đi kèm rủi ro. Hãy kiểm tra audit, TVL, lịch sử vận hành, tokenomics và quyền kiểm soát hợp đồng trước khi gửi vốn.`,
    primaryKeyword: "DeFi",
    slug: "defi-la-gi-tim-hieu-he-sinh-thai-defi-tu-a-den-z",
    title: "DeFi là gì? Tìm hiểu hệ sinh thái DeFi từ A đến Z"
  },
  {
    excerpt: "Hướng dẫn đọc dữ liệu on-chain: dòng tiền sàn giao dịch, ví lớn, holder dài hạn và những tín hiệu dễ bị hiểu sai.",
    markdown: `Dữ liệu on-chain là các dấu vết giao dịch được ghi trực tiếp trên blockchain. Khi đọc đúng cách, dữ liệu này giúp quan sát dòng tiền, hành vi ví lớn và mức độ hoạt động của mạng lưới.

## Dòng tiền lên và xuống sàn

Token nạp lên sàn có thể cho thấy ý định bán, còn token rút khỏi sàn có thể phản ánh nhu cầu tự lưu ký. Tuy nhiên, một giao dịch đơn lẻ không đủ để kết luận xu hướng.

## Ví lớn và smart money

Theo dõi ví lớn giúp phát hiện các chuyển động đáng chú ý, nhưng không nên sao chép máy móc. Một ví có thể chuyển tài sản vì lý do bảo mật, OTC hoặc tái cân bằng nội bộ.

## Cách dùng hiệu quả

Kết hợp on-chain với giá, volume, funding rate và bối cảnh tin tức. Tín hiệu mạnh nhất thường đến từ sự đồng thuận của nhiều nguồn dữ liệu.`,
    primaryKeyword: "On-chain",
    slug: "on-chain-la-gi-cach-doc-du-lieu-on-chain-hieu-qua",
    title: "On-chain là gì? Cách đọc dữ liệu on-chain hiệu quả"
  },
  {
    excerpt: "Bảy nguyên tắc giúp nhà đầu tư crypto kiểm soát vị thế, cảm xúc và rủi ro trong thị trường biến động mạnh.",
    markdown: `Quản trị rủi ro là nền tảng sống còn trong crypto. Thị trường có thể tăng rất nhanh, nhưng cũng có thể đảo chiều mạnh trong thời gian ngắn.

## Không đặt toàn bộ vốn vào một kịch bản

Hãy phân bổ vốn theo nhiều mức rủi ro và luôn giữ phần tiền mặt dự phòng. Một danh mục tốt không chỉ tối đa hóa lợi nhuận, mà còn giúp bạn tồn tại qua chu kỳ xấu.

## Luôn biết điểm sai

Trước khi vào lệnh, hãy xác định điều kiện khiến nhận định ban đầu không còn đúng. Đây là cơ sở để cắt lỗ hoặc giảm vị thế mà không bị cảm xúc chi phối.

## Tránh giao dịch vì FOMO

Khi một tài sản đã tăng mạnh, rủi ro mua đuổi thường cao. Nếu bỏ lỡ một cơ hội, hãy chờ setup mới thay vì ép bản thân phải hành động ngay.`,
    primaryKeyword: "Quản trị rủi ro",
    slug: "quan-tri-rui-ro-trong-crypto-7-nguyen-tac-vang",
    title: "Quản trị rủi ro trong crypto: 7 nguyên tắc vàng"
  }
];

export function getFallbackReaderArticles(locale: Locale): ReaderArticle[] {
  const now = "2026-06-12T00:00:00.000Z";

  return featuredKnowledgeArticles.map((article, index) => ({
    articleId: `fallback-knowledge-${index + 1}`,
    articleSection: "knowledge",
    authorBio: "Đội ngũ CoinRadar biên tập nội dung theo hướng dễ hiểu, thực tế và bám sát nhu cầu của nhà đầu tư Việt.",
    authorName: "CoinRadar Research",
    authorTitle: "Knowledge Desk",
    excerpt: article.excerpt,
    id: `fallback-knowledge-${index + 1}`,
    language: locale === "vi-vn" ? "vi" : "en",
    livePath: `/${locale}/${article.slug}`,
    locale,
    markdown: article.markdown,
    metaDescription: article.excerpt,
    metaTitle: article.title,
    primaryKeyword: article.primaryKeyword,
    publishedAt: now,
    secondaryKeywords: ["crypto", "kiến thức", "đầu tư"],
    slug: article.slug,
    title: article.title
  }));
}
