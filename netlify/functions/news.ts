import { serveNews } from "../../server/news";
export default async function (request: Request) {
  const url = new URL(request.url);
  if (url.pathname === "/.netlify/functions/news") {
    const id = url.searchParams.get("article");
    url.pathname = "/api/news" + (id ? "/" + id : "");
    url.searchParams.delete("article");
  }
  return serveNews(new Request(url, { method: request.method }));
}
