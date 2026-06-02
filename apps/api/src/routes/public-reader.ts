import { Router } from "express";
import { localeSchema } from "@cmsauto/contracts";

import { readPublishedArticleBySlug, readPublishedArticles } from "../store.js";

export const publicReaderRouter = Router();

publicReaderRouter.get("/articles", async (request, response, next) => {
  try {
    const locale = localeSchema.parse(request.query.locale ?? "vi-vn");
    const page = Math.max(1, Number(request.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(request.query.pageSize ?? 20)));
    const articles = await readPublishedArticles(locale);
    const start = (page - 1) * pageSize;
    response.json({
      articles: articles.slice(start, start + pageSize),
      page,
      pageSize,
      total: articles.length
    });
  } catch (error) {
    next(error);
  }
});

publicReaderRouter.get("/articles/:locale/:slug", async (request, response, next) => {
  try {
    const locale = localeSchema.parse(request.params.locale);
    const article = await readPublishedArticleBySlug(locale, request.params.slug);
    if (!article) {
      response.status(404).json({ error: "Không tìm thấy bài viết." });
      return;
    }
    response.json({ article });
  } catch (error) {
    next(error);
  }
});

