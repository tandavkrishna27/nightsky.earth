import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Calendar, ExternalLink, ArrowLeft, User } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ContentSection from "@/components/ContentSection";
import LoadingPage from "@/components/LoadingPage";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@shared/schema";

export default function NewsArticle() {
  const [, params] = useRoute("/news/:id");
  const [, setLocation] = useLocation();
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch individual article
  const { data: article, isLoading, error } = useQuery<NewsArticle>({
    queryKey: ["/api/news", params?.id],
    queryFn: async () => {
      const response = await fetch(`/api/news/${params?.id}`);
      if (!response.ok) throw new Error('Failed to fetch article');
      return response.json();
    },
    enabled: !!params?.id,
  });

  if (isPageLoading) {
    return <LoadingPage message="Loading article..." />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-32 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading article...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-32 text-center">
          <p className="text-destructive mb-6">Article not found</p>
          <Button
            data-testid="button-back-to-news"
            onClick={() => setLocation("/news")}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Format published date
  const publishedDate = new Date(article.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const publishedTime = new Date(article.published_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // JSON-LD schema for the article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.summary,
    "image": article.image_url,
    "datePublished": article.published_at,
    "dateModified": article.updated_at,
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
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://nightsky.earth/news/${article.id}`
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${article.title} - Night Sky News`}
        description={article.summary}
        keywords={`${article.news_site}, astronomy news, space news, ${article.title}`}
        ogImage={article.image_url}
        schema={articleSchema}
      />
      <Navigation />

      {/* Back Button */}
      <div className="container mx-auto px-4 pt-24">
        <Button
          data-testid="button-back"
          variant="ghost"
          onClick={() => setLocation("/news")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to News
        </Button>
      </div>

      <ContentSection>
        <article className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-8">
            {/* Source Badge */}
            <div className="mb-4">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {article.news_site}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-light mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={article.published_at}>
                  {publishedDate} at {publishedTime}
                </time>
              </div>

              {article.authors && article.authors.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {article.authors.map(author => author.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {article.image_url && (
            <div className="mb-10 rounded-lg overflow-hidden">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-auto"
                data-testid="img-article-featured"
              />
            </div>
          )}

          {/* Article Summary */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-10">
            <p className="text-lg leading-relaxed text-foreground/90">
              {article.summary}
            </p>
          </div>

          {/* Read Full Article CTA */}
          <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-4">
              This is a preview. Read the full article on the original source:
            </p>
            <Button
              data-testid="button-read-full-article"
              asChild
              size="lg"
              className="gap-2"
            >
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                Read Full Article on {article.news_site}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Additional Article Info */}
          {(article.launches && article.launches.length > 0) || (article.events && article.events.length > 0) ? (
            <div className="mt-10 pt-10 border-t border-white/10">
              <h2 className="text-2xl font-light mb-4">Related Information</h2>
              
              {article.launches && article.launches.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    This article is related to {article.launches.length} rocket launch{article.launches.length > 1 ? 'es' : ''}.
                  </p>
                </div>
              )}

              {article.events && article.events.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    This article is related to {article.events.length} space event{article.events.length > 1 ? 's' : ''}.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </article>
      </ContentSection>

      <Footer />
    </div>
  );
}
