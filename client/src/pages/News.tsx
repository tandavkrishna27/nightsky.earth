import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ContentSection from "@/components/ContentSection";
import LoadingPage from "@/components/LoadingPage";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { PaginatedNewsResponse, NewsArticle } from "@shared/schema";
import { useLocation } from "wouter";

export default function News() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [, setLocation] = useLocation();

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch news articles
  const { data, isLoading, error } = useQuery<PaginatedNewsResponse>({
    queryKey: ["/api/news", currentPage, searchQuery, selectedSource],
    queryFn: async () => {
      const offset = currentPage * ITEMS_PER_PAGE;
      let url = `/api/news?limit=${ITEMS_PER_PAGE}&offset=${offset}`;
      
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      
      if (selectedSource) {
        url += `&news_site=${encodeURIComponent(selectedSource)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    },
  });

  // Popular news sources for filtering
  const popularSources = [
    "NASA",
    "ESA",
    "SpaceX",
    "Space.com",
    "SpaceNews",
    "NASASpaceflight",
    "Ars Technica",
    "The Verge"
  ];

  if (isPageLoading) {
    return <LoadingPage message="Loading cosmic news..." />;
  }

  const totalPages = data ? Math.ceil(data.count / ITEMS_PER_PAGE) : 0;

  // Comprehensive schemas for SEO and AI search
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nightsky.earth';
  
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "NightSky.earth",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/news?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NightSky.earth",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Curated night-sky and meteor shower experiences connecting Earth to the stars",
    "sameAs": [
      // Add social media links when available
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "News",
        "item": `${baseUrl}/news`
      }
    ]
  };

  const itemListSchema = data && data.results.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": data.results.map((article, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "NewsArticle",
        "headline": article.title,
        "description": article.summary,
        "image": article.image_url,
        "datePublished": article.published_at,
        "author": article.authors && article.authors.length > 0
          ? article.authors.map(author => ({
              "@type": "Person",
              "name": author.name
            }))
          : {
              "@type": "Organization",
              "name": article.news_site
            },
        "publisher": {
          "@type": "Organization",
          "name": article.news_site
        },
        "url": `${baseUrl}/news/${article.id}`
      }
    })),
    "numberOfItems": data.results.length
  } : null;

  const schemas = [
    websiteSchema,
    organizationSchema,
    breadcrumbSchema,
    ...(itemListSchema ? [itemListSchema] : [])
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Night Sky & Space News - Latest Astronomy Updates"
        description="Stay updated with the latest astronomy and space exploration news from NASA, ESA, SpaceX, and leading space agencies worldwide. Discover meteor showers, rocket launches, celestial discoveries, dark sky locations, and astrophotography updates. Real-time coverage from 40+ trusted sources."
        keywords="astronomy news, space news, NASA updates, ESA news, SpaceX launches, meteor showers, celestial events, space exploration, rocket launches, astronomical discoveries, dark sky locations, astrophotography, night sky events, stargazing news, satellite launches, planetary science"
        schema={schemas}
      />
      <Navigation />

      <ContentSection>
        {/* Search and Filters */}
        <div className="mb-12 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              data-testid="input-news-search"
              type="text"
              placeholder="Search news articles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0); // Reset to first page on search
              }}
              className="pl-12 py-6 text-lg bg-card/50 backdrop-blur-sm border-white/10"
            />
          </div>

          {/* Source Filters */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              data-testid="button-filter-all"
              variant={selectedSource === "" ? "default" : "outline"}
              onClick={() => {
                setSelectedSource("");
                setCurrentPage(0);
              }}
              className="rounded-full"
            >
              All Sources
            </Button>
            {popularSources.map((source) => (
              <Button
                key={source}
                data-testid={`button-filter-${source.toLowerCase().replace(/\s+/g, '-')}`}
                variant={selectedSource === source ? "default" : "outline"}
                onClick={() => {
                  setSelectedSource(source);
                  setCurrentPage(0);
                }}
                className="rounded-full"
              >
                {source}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading articles...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">Failed to load news articles. Please try again later.</p>
          </div>
        )}

        {/* Articles Grid */}
        {data && data.results.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {data.results.map((article) => (
                <Card
                  key={article.id}
                  data-testid={`card-article-${article.id}`}
                  className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all"
                  onClick={() => setLocation(`/news/${article.id}`)}
                >
                  {/* Article Image */}
                  {article.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <CardHeader className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {article.news_site}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {article.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {article.summary}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <Button
                  data-testid="button-prev-page"
                  variant="outline"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                </div>

                <Button
                  data-testid="button-next-page"
                  variant="outline"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* No Results */}
        {data && data.results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No articles found. Try adjusting your search or filters.</p>
          </div>
        )}
      </ContentSection>

      <Footer />
    </div>
  );
}
