export type NewsArticle = {
  id: number;
  title: string;
  url: string;
  publisher: string;
  summary: string;
  publishedAt: string | null;
  imageUrl: string | null;
};
export type NewsPage = { count: number; results: NewsArticle[] };
