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

  const httpServer = createServer(app);

  return httpServer;
}
