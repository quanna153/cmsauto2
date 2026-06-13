export function mockArticleViews(articleId: string) {
  let hash = 0;
  for (const character of articleId) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return 350 + Math.abs(hash % 24750);
}
