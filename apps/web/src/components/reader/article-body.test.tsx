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
});
