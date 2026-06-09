import type { ReaderArticle } from "@/features/reader/model";

/**
 * Typed mock articles used by the search adapter when the real
 * API is unavailable or when running tests in isolation.
 * Each entry must satisfy the full ReaderArticle shape so
 * ArticleCard can render without guard casts.
 */
export const searchMockArticles: ReaderArticle[] = [
  {
    id: "mock-1",
    articleId: "session-mock-1",
    slug: "bitcoin-la-gi",
    locale: "vi-vn",
    language: "vi",
    title: "Bitcoin là gì? Hướng dẫn cơ bản cho người mới",
    excerpt:
      "Tìm hiểu Bitcoin — tài sản số phi tập trung hoạt động trên nền tảng blockchain — theo cách đơn giản và dễ hiểu nhất.",
    metaTitle: "Bitcoin là gì? Hướng dẫn cơ bản",
    metaDescription: "Tìm hiểu bitcoin và blockchain theo cách rõ ràng cho người mới.",
    markdown: "",
    publishedAt: "2025-01-15T08:00:00.000Z",
    livePath: "/vi-vn/bitcoin-la-gi",
    primaryKeyword: "bitcoin",
    secondaryKeywords: ["blockchain", "crypto"],
  },
  {
    id: "mock-2",
    articleId: "session-mock-2",
    slug: "ethereum-la-gi",
    locale: "vi-vn",
    language: "vi",
    title: "Ethereum là gì? Nền tảng hợp đồng thông minh",
    excerpt:
      "Ethereum không chỉ là tiền mã hóa — đây là nền tảng lập trình phi tập trung cho phép triển khai smart contract và DApp.",
    metaTitle: "Ethereum là gì?",
    metaDescription: "Hướng dẫn toàn diện về Ethereum và hợp đồng thông minh.",
    markdown: "",
    publishedAt: "2025-02-10T08:00:00.000Z",
    livePath: "/vi-vn/ethereum-la-gi",
    primaryKeyword: "ethereum",
    secondaryKeywords: ["smart contract", "defi"],
  },
  {
    id: "mock-3",
    articleId: "session-mock-3",
    slug: "blockchain-la-gi",
    locale: "vi-vn",
    language: "vi",
    title: "Blockchain là gì? Công nghệ đằng sau tiền mã hóa",
    excerpt:
      "Blockchain là sổ cái phân tán, bất biến, lưu mọi giao dịch một cách minh bạch mà không cần bên trung gian tin cậy.",
    metaTitle: "Blockchain là gì?",
    metaDescription: "Hiểu blockchain từ cơ bản đến ứng dụng thực tế.",
    markdown: "",
    publishedAt: "2025-03-01T08:00:00.000Z",
    livePath: "/vi-vn/blockchain-la-gi",
    primaryKeyword: "blockchain",
    secondaryKeywords: ["distributed ledger", "bitcoin"],
  },
  {
    id: "mock-4",
    articleId: "session-mock-4",
    slug: "defi-la-gi",
    locale: "vi-vn",
    language: "vi",
    title: "DeFi là gì? Tài chính phi tập trung và cơ hội đầu tư",
    excerpt:
      "DeFi (Decentralized Finance) mang dịch vụ tài chính lên blockchain, loại bỏ ngân hàng truyền thống và mở ra thanh khoản toàn cầu.",
    metaTitle: "DeFi là gì?",
    metaDescription: "Khám phá DeFi, yield farming và liquidity pool.",
    markdown: "",
    publishedAt: "2025-03-20T08:00:00.000Z",
    livePath: "/vi-vn/defi-la-gi",
    primaryKeyword: "defi",
    secondaryKeywords: ["yield farming", "ethereum"],
  },
  {
    id: "mock-5",
    articleId: "session-mock-5",
    slug: "what-is-bitcoin",
    locale: "en-us",
    language: "en",
    title: "What is Bitcoin? A Beginner's Guide",
    excerpt:
      "Bitcoin is a decentralized digital currency that operates without a central authority, powered by blockchain technology.",
    metaTitle: "What is Bitcoin?",
    metaDescription: "Learn about Bitcoin and how it works for beginners.",
    markdown: "",
    publishedAt: "2025-01-15T08:00:00.000Z",
    livePath: "/en-us/what-is-bitcoin",
    primaryKeyword: "bitcoin",
    secondaryKeywords: ["blockchain", "crypto"],
  },
  {
    id: "mock-6",
    articleId: "session-mock-6",
    slug: "what-is-ethereum",
    locale: "en-us",
    language: "en",
    title: "What is Ethereum? The Programmable Blockchain",
    excerpt:
      "Ethereum extends Bitcoin's vision by enabling smart contracts and decentralized applications on its blockchain.",
    metaTitle: "What is Ethereum?",
    metaDescription: "Comprehensive guide to Ethereum and smart contracts.",
    markdown: "",
    publishedAt: "2025-02-10T08:00:00.000Z",
    livePath: "/en-us/what-is-ethereum",
    primaryKeyword: "ethereum",
    secondaryKeywords: ["smart contract", "defi"],
  },
];
