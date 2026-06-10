import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArticleBody } from "./article-body";

describe("ArticleBody", () => {
  it("does not render raw HTML or injected link attributes", () => {
    const html = renderToStaticMarkup(
      <ArticleBody markdown={'<script>alert(1)</script>\n\n[click](https://example.com/" onmouseover="alert(1))'} />
    );

    expect(html).not.toContain("<script>");
    expect(html).not.toMatch(/<a[^>]+onmouseover/i);
  });

  it("renders uploaded image data URLs from manual posts", () => {
    const html = renderToStaticMarkup(
      <ArticleBody markdown="![Ảnh minh họa](data:image/png;base64,aGVsbG8=)" />
    );

    expect(html).toContain("<img");
    expect(html).toContain('src="data:image/png;base64,aGVsbG8="');
    expect(html).toContain('alt="Ảnh minh họa"');
  });

  it("renders manual underline formatting without allowing raw HTML", () => {
    const html = renderToStaticMarkup(
      <ArticleBody markdown="[gạch chân](underline:)\n\n<u>raw</u>" />
    );

    expect(html).toContain("<u>gạch chân</u>");
    expect(html).not.toContain("<u>raw</u>");
  });

  it("renders manual highlight formatting without allowing raw mark HTML", () => {
    const html = renderToStaticMarkup(
      <ArticleBody markdown="[đánh dấu](highlight:yellow)\n\n<mark>raw</mark>" />
    );

    expect(html).toContain("<mark");
    expect(html).toContain("đánh dấu");
    expect(html).not.toContain("<mark>raw</mark>");
  });

  it("renders a table of contents from article headings", () => {
    const html = renderToStaticMarkup(
      <ArticleBody markdown={"## Tổng quan\n\nNội dung.\n\n### Chi tiết\n\nNội dung.\n\n## Tổng quan"} />
    );

    expect(html).toContain("Table of Contents");
    expect(html).toContain(">1. Tổng quan</a>");
    expect(html).toContain(">Chi tiết</a>");
    expect(html).toContain(">2. Tổng quan</a>");
    expect(html).toContain('href="#tong-quan"');
    expect(html).toContain('id="tong-quan"');
    expect(html).toContain('href="#chi-tiet"');
    expect(html).toContain('id="chi-tiet"');
    expect(html).toContain('href="#tong-quan-2"');
    expect(html).toContain('id="tong-quan-2"');
  });

  it("can suppress the table of contents when a page-level TOC already exists", () => {
    const html = renderToStaticMarkup(
      <ArticleBody markdown={"## Tổng quan\n\nNội dung."} showToc={false} />
    );

    expect(html).not.toContain("Table of Contents");
    expect(html).toContain('id="tong-quan"');
  });

  it("preserves dash and dot unordered list styles", () => {
    const html = renderToStaticMarkup(
      <ArticleBody markdown={"- Dash item\n\n* Dot item"} />
    );

    expect(html).toContain('data-cms-list-style="dash"');
    expect(html).toContain('data-cms-list-style="dot"');
  });

  it("renders markdown tables as real table markup", () => {
    const html = renderToStaticMarkup(
      <ArticleBody markdown={"| Cột 1 | Cột 2 |\n| --- | --- |\n| Dữ liệu dài | Giá trị |"} />
    );

    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<th>Cột 1</th>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("<td>Dữ liệu dài</td>");
  });
});
