import { z } from "zod";

export const localeSchema = z.enum(["vi-vn", "en-us"]);
export type Locale = z.infer<typeof localeSchema>;

export const languageSchema = z.enum(["vi", "en"]);
export type Language = z.infer<typeof languageSchema>;

export const articleEditableFieldsSchema = z.object({
  inputs: z.object({
    language: languageSchema,
    seedKeyword: z.string()
  }).optional(),
  activeStep: z.enum(["keywords", "brief", "outline", "draft", "links", "ready"]).optional(),
  primaryKeywordId: z.string().nullable().optional(),
  secondaryKeywordIds: z.array(z.string()).optional(),
  keywordIdeas: z.array(z.unknown()).optional(),
  brief: z.unknown().nullable().optional(),
  outline: z.unknown().nullable().optional(),
  draft: z.unknown().nullable().optional(),
  linkSuggestions: z.array(z.unknown()).optional(),
  finalMarkdown: z.string().optional(),
  reviewNote: z.string().optional()
}).strict();

export const articlePatchSchema = z.object({
  expectedRevision: z.number().int().positive(),
  changes: articleEditableFieldsSchema
}).strict();

export type ArticlePatch = z.infer<typeof articlePatchSchema>;

export const revisionConflictSchema = z.object({
  code: z.literal("REVISION_CONFLICT"),
  article: z.unknown()
});

export type RevisionConflict = z.infer<typeof revisionConflictSchema>;
