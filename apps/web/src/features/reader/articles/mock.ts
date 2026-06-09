import type { Locale } from "@cmsauto/contracts";

import type { ReaderArticle } from "@/features/reader/model";

export function getMockArticles(locale: Locale): ReaderArticle[] {
  const now = "2026-01-01T00:00:00.000Z";
  return [
    {
      id: "mock-market-news",
      articleId: "mock-market-news",
      slug: "tin-tuc-thi-truong",
      locale,
      language: locale === "vi-vn" ? "vi" : "en",
      title: "Tin tức thị trường",
      excerpt: "Cập nhật mock về biến động thị trường Crypto, nhóm coin nổi bật và các mốc giá đáng chú ý.",
      metaTitle: "Tin tức thị trường",
      metaDescription: "Tin tức thị trường Crypto mock.",
      markdown: "",
      publishedAt: now,
      livePath: `/${locale}/tin-tuc-thi-truong`,
      primaryKeyword: "Thị trường",
      secondaryKeywords: []
    },
    {
      id: "mock-investor-view",
      articleId: "mock-investor-view",
      slug: "goc-nhin-dau-tu",
      locale,
      language: locale === "vi-vn" ? "vi" : "en",
      title: "Góc nhìn đầu tư",
      excerpt: "Các quan sát mock về kịch bản thị trường, quản trị rủi ro và cách xây dựng danh mục theo mục tiêu.",
      metaTitle: "Góc nhìn đầu tư",
      metaDescription: "Góc nhìn đầu tư Crypto mock.",
      markdown: "",
      publishedAt: now,
      livePath: `/${locale}/goc-nhin-dau-tu`,
      primaryKeyword: "Đầu tư",
      secondaryKeywords: []
    },
    {
      id: "mock-beginner-guide",
      articleId: "mock-beginner-guide",
      slug: "huong-dan-nguoi-moi",
      locale,
      language: locale === "vi-vn" ? "vi" : "en",
      title: "Hướng dẫn người mới",
      excerpt: "Bộ nội dung mock giúp người mới hiểu coin, ví, sàn giao dịch và cách đọc biểu đồ cơ bản.",
      metaTitle: "Hướng dẫn người mới",
      metaDescription: "Hướng dẫn Crypto cho người mới.",
      markdown: "",
      publishedAt: now,
      livePath: `/${locale}/huong-dan-nguoi-moi`,
      primaryKeyword: "Người mới",
      secondaryKeywords: []
    },
    {
      id: "mock-ecosystem-update",
      articleId: "mock-ecosystem-update",
      slug: "cap-nhat-he-sinh-thai",
      locale,
      language: locale === "vi-vn" ? "vi" : "en",
      title: "Cập nhật hệ sinh thái",
      excerpt: "Theo dõi mock các hệ sinh thái lớn, dự án mới và xu hướng sử dụng trong DeFi, NFT và Layer 2.",
      metaTitle: "Cập nhật hệ sinh thái",
      metaDescription: "Cập nhật hệ sinh thái Crypto mock.",
      markdown: "",
      publishedAt: now,
      livePath: `/${locale}/cap-nhat-he-sinh-thai`,
      primaryKeyword: "Hệ sinh thái",
      secondaryKeywords: []
    }
  ];
}
