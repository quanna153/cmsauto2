import type { Locale } from "@cmsauto/contracts";

export const locales: Locale[] = ["vi-vn", "en-us"];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localeCopy(locale: Locale) {
  return locale === "vi-vn"
    ? { brand: "CMS Auto Việt Nam", home: "Trang chủ", markets: "Thị trường", knowledge: "Kiến thức", analysis: "Phân tích", articles: "Bài viết", about: "Giới thiệu", search: "Tìm kiếm", latest: "Bài viết mới", featured: "Nổi bật", related: "Bài liên quan" }
    : { brand: "CMS Auto Global", home: "Home", markets: "Markets", knowledge: "Knowledge", analysis: "Analysis", articles: "Articles", about: "About", search: "Search", latest: "Latest articles", featured: "Featured", related: "Related articles" };
}

