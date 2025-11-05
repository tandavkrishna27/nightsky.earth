import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const SNAPI_BASE_URL = "https://api.spaceflightnewsapi.net/v4";

export async function registerRoutes(app: Express): Promise<Server> {
  // News API routes - proxy to Spaceflight News API
  
  // Get list of news articles with optional filters
  app.get("/api/news", async (req, res) => {
    try {
      const { limit = "12", offset = "0", search = "", news_site = "" } = req.query;
      
      let url = `${SNAPI_BASE_URL}/articles/?limit=${limit}&offset=${offset}`;
      
      if (search && typeof search === "string") {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      if (news_site && typeof news_site === "string") {
        url += `&news_site=${encodeURIComponent(news_site)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: "Failed to fetch news articles" 
        });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get individual news article by ID
  app.get("/api/news/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const response = await fetch(`${SNAPI_BASE_URL}/articles/${id}/`);
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: "Article not found" 
        });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Dynamic sitemap.xml generation
  app.get("/sitemap.xml", async (req, res) => {
    try {
      // Fetch latest 50 articles from the API
      const response = await fetch(`${SNAPI_BASE_URL}/articles/?limit=50&offset=0`);
      
      if (!response.ok) {
        console.error("Failed to fetch articles for sitemap");
        return res.status(500).send("Error generating sitemap");
      }
      
      const data = await response.json();
      const articles = data.results || [];
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Build XML sitemap
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
      xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
      xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n\n';
      
      // Static pages
      const staticPages = [
        { loc: '/', lastmod: today, changefreq: 'weekly', priority: '1.0' },
        { loc: '/about', lastmod: today, changefreq: 'monthly', priority: '0.8' },
        { loc: '/experiences', lastmod: today, changefreq: 'weekly', priority: '0.9' },
        { loc: '/meteor-nights', lastmod: today, changefreq: 'monthly', priority: '0.9' },
        { loc: '/community', lastmod: today, changefreq: 'monthly', priority: '0.7' },
        { loc: '/news', lastmod: today, changefreq: 'daily', priority: '0.9' },
        { loc: '/resources', lastmod: today, changefreq: 'weekly', priority: '0.8' },
        { loc: '/contact', lastmod: today, changefreq: 'monthly', priority: '0.6' },
        { loc: '/meteor-shower/perseids', lastmod: today, changefreq: 'yearly', priority: '0.7' },
        { loc: '/meteor-shower/geminids', lastmod: today, changefreq: 'yearly', priority: '0.7' },
        { loc: '/meteor-shower/quadrantids', lastmod: today, changefreq: 'yearly', priority: '0.7' },
        { loc: '/meteor-shower/lyrids', lastmod: today, changefreq: 'yearly', priority: '0.7' },
        { loc: '/meteor-shower/orionids', lastmod: today, changefreq: 'yearly', priority: '0.7' },
        { loc: '/meteor-shower/leonids', lastmod: today, changefreq: 'yearly', priority: '0.7' },
      ];
      
      staticPages.forEach(page => {
        xml += `  <url>\n`;
        xml += `    <loc>https://nightsky.earth${page.loc}</loc>\n`;
        xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n\n`;
      });
      
      // Dynamic news articles
      xml += `  <!-- Latest ${articles.length} News Articles - Auto-updated from 40+ sources -->\n`;
      xml += `  <!-- Total 30,000+ articles discoverable via /news with pagination and ItemList schema -->\n`;
      
      articles.forEach((article: any) => {
        // Skip articles with missing/invalid data
        if (!article.id || !article.published_at) {
          return;
        }
        
        // Safely parse article date, fallback to today if invalid
        let articleDate: string;
        try {
          articleDate = new Date(article.published_at).toISOString().split('T')[0];
        } catch (error) {
          console.warn(`Invalid date for article ${article.id}, using today's date`);
          articleDate = today;
        }
        
        xml += `  <url>\n`;
        xml += `    <loc>https://nightsky.earth/news/${article.id}</loc>\n`;
        xml += `    <lastmod>${articleDate}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n\n`;
      });
      
      xml += '</urlset>\n';
      
      // Set proper content type and send
      res.header('Content-Type', 'application/xml');
      res.send(xml);
      
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
