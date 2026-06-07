import { env } from "./config.js";

export type TavilyResult = {
  keyword: string;
  url: string;
  title: string;
  snippet: string;
};

export async function searchTavily(query: string, maxResults: number = 5): Promise<TavilyResult[]> {
  const apiKey = env.TAVILY_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: maxResults,
        include_domains: [],
        exclude_domains: [],
      }),
    });

    if (!response.ok) {
      console.error(`Tavily API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((item: any) => ({
      keyword: query,
      url: item.url,
      title: item.title,
      snippet: item.content,
    }));
  } catch (error) {
    console.error("Failed to fetch from Tavily:", error);
    return [];
  }
}
