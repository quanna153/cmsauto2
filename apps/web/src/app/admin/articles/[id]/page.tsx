import { ArticleEditorFeature } from "@/features/admin/articles/article-editor";

export default async function ArticleEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleEditorFeature id={id} />;
}

