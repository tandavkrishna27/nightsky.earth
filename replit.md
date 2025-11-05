# NightSky.earth - Curated Night-Sky Experiences

## Overview
NightSky.earth is a brand offering curated night-sky and meteor experiences through a cinematic, minimalist website. The project aims to provide an emotion-first storytelling experience with a dark, cosmic aesthetic, connecting Earth to the stars. Key capabilities include showcasing meteor shower calendars, providing comprehensive stargazing resources, facilitating community collaboration, and offering a dynamic astronomy news section. The platform emphasizes a premium feel, serene design, and poetic language to evoke wonder and facilitate immersive celestial experiences.

## Recent Updates (November 5, 2025)

### News Page UI Enhancements
Improved the news page with streamlined design and flexible viewing options:

**Streamlined Design:**
- Removed auto-update banner for cleaner, less cluttered interface
- Focus on content-first approach with improved visual hierarchy

**Horizontal Scrolling Filters:**
- Topic filters (Comets, Asteroids, Meteor Showers, Planets, Stars, Galaxies, Telescopes) now scroll horizontally
- Source filters (NASA, ESA, JPL, Space.com, etc.) presented in horizontal scroll layout
- Better mobile experience with swipeable filter navigation
- Prevents filter wrapping and maintains clean single-line presentation

**View Mode Toggle:**
- **Grid View** (default): Responsive 3-column layout (1 col mobile, 2 tablet, 3 desktop) with compact article cards
- **Scroll View** (InShorts-style): Single column centered layout with full-width cards, larger images (h-64), expanded text, and improved readability
- Toggle buttons with Grid3x3 and List icons for intuitive switching
- View preference maintained during filtering and pagination

**UX Improvements:**
- Both views maintain full functionality (click-through navigation, pagination, search)
- Smooth transitions between view modes
- Responsive design optimized for all screen sizes
- Touch-friendly controls for mobile devices

### Comprehensive SEO & GEO (AI Search) Optimization
Enhanced the entire site with advanced SEO and GEO optimization for maximum discoverability by search engines and AI assistants (ChatGPT, Claude, Perplexity, Google AI, etc.):

**News Listing Page (/news):**
- Multiple JSON-LD schemas: WebSite (with SearchAction), Organization, BreadcrumbList, ItemList
- ItemList schema catalogs all visible articles for enhanced discovery
- Comprehensive keywords covering astronomy, space, meteor showers, dark sky locations, astrophotography
- Enhanced meta description highlighting 40+ trusted news sources

**News Article Pages (/news/:id):**
- Advanced NewsArticle schema with ImageObject, publisher, genre, keywords, articleSection
- BreadcrumbList schema (Home > News > Article) for navigation context
- Organization schema for brand recognition
- Article-specific Open Graph tags: published_time, modified_time, author, section, tags
- Enhanced Twitter Cards with author and publish date metadata
- Optimized for Google Rich Results and social sharing

**SEO Component:**
- Support for article-specific meta tags
- Conditional rendering based on content type
- Multiple schema support (accepts arrays)
- Enhanced Twitter card metadata with labels

**Robots.txt - AI Crawler Optimization:**
- Explicit welcome for AI crawlers: GPTBot, ChatGPT-User, CCBot, Claude-Web, anthropic-ai, PerplexityBot, YouBot, Google-Extended
- Optimized crawl-delay: 0 for AI/Google, 1 for Bing, 2 for others
- Explicit Allow directives for /news and /news/*
- Transparency note about news source aggregation

**Dynamic Sitemap.xml:**
- Dynamically generates sitemap with latest 50 news articles from API
- Uses actual published_at dates for lastmod (auto-updates with new content)
- Includes all 14 static pages (homepage, about, experiences, meteor showers, etc.)
- Robust error handling for missing/invalid article data
- Total 64 URLs: 14 static + 50 dynamic articles
- Accessible at /sitemap.xml with proper XML formatting
- Optimized changefreq: daily for listing, weekly for articles
- Priority settings: 0.9 for news listing, 0.7 for articles

**Expected Benefits:**
- Google Rich Results eligibility for news articles
- Enhanced social media sharing with rich previews
- AI assistants can discover, cite, and reference content
- Improved rankings for astronomy/space news queries
- Better voice search and AI search engine discovery

### Enhanced News Sources & Topics
Expanded news coverage to include comprehensive astronomical events:

**Expanded Sources** (12 total):
- NASA, ESA, Jet Propulsion Laboratory (JPL)
- Space.com, SpaceNews, NASASpaceflight, Spaceflight Now
- Phys, Arstechnica, European Spaceflight
- SpacePolicyOnline.com, Space Scout

**Quick Topic Filters** for Astronomical Events:
- Comets (including interstellar objects like 3I/ATLAS)
- Asteroids and near-Earth objects
- Meteor Showers
- Planets and planetary science
- Stars and stellar phenomena
- Galaxies and deep space
- Telescopes and observations

**Auto-Updating Content:**
- News refreshes automatically from 40+ sources via Spaceflight News API
- Real-time updates multiple times daily
- Live indicator shows content auto-refreshing status
- No manual updates required - always current

## User Preferences
I want the agent to use simple language and provide detailed explanations when necessary. I prefer an iterative development approach, where changes are discussed and approved before implementation. The agent should prioritize maintaining the dark, cinematic aesthetic and smooth animations. I want to be asked before any major architectural changes are made or new external dependencies are introduced.

## System Architecture
The project is built with a minimalist and cinematic design philosophy, prioritizing emotion-first storytelling and a dark, cosmic aesthetic. The UI/UX emphasizes generous whitespace, cosmic color palettes, parallax scrolling, and subtle animations for smooth interactions.

**Technical Implementations & Features:**
- **Dynamic Content**: Displays upcoming meteor showers based on the current date, and a comprehensive 2025/2026 meteor shower calendar.
- **Experience Status System**: Differentiates between "Active" and "Coming Soon" experiences with appropriate badging and CTAs.
- **Astronomy News Section**: Integrates real-time astronomy news with dual-view layouts (grid/scroll), horizontal scrolling filters, search, source filtering, and pagination. Features InShorts-style scroll view for focused reading.
- **Comprehensive SEO**: Utilizes `react-helmet-async` for dynamic meta tags, Open Graph, Twitter Cards, canonical URLs, geo meta tags, and extensive JSON-LD structured data across all pages. Includes `robots.txt` and `sitemap.xml` generation.
- **Video Backgrounds**: Supports time-lapse night sky videos in hero sections with auto-looping, slow motion, and static image fallbacks.
- **Animations**: Implements a clean meteor loader, smooth navigation transitions, hero section parallax scrolling, and interactive button animations using Framer Motion.
- **Community Page**: Features sections for collaboration, partnership benefits, and direct WhatsApp integration.
- **Resources Page**: Provides curated lists of mobile apps, desktop software, web resources, gear guides, and dark sky locations.

**System Design Choices:**
- **Data Structure**: Centralized meteor shower data in `shared/meteorShowers.ts` with helper functions for dynamic retrieval.
- **Component-Based**: Reusable components like `ExperienceCard`, `HeroSection`, `MeteorLoader`, and `SEO` for modularity.
- **Routing**: Client-side routing handled by Wouter, defining clear paths for all major sections and dynamic detail pages (`/meteor-shower/:id`, `/news/:id`).
- **Responsive Design**: Mobile-first approach with enhancements for tablet and desktop views.
- **Deployment**: Configured for Netlify, including `netlify.toml` for build processes, redirects, security headers, and caching strategies.

**Technology Stack:**
- **Frontend**: React, TypeScript, Wouter (routing), Framer Motion (animations), Tailwind CSS, shadcn/ui, Lucide React (icons).
- **Backend (API Proxy)**: Node.js with routes in `server/routes.ts` for external API integration (e.g., Spaceflight News API).
- **Data Validation**: Zod for schema validation.
- **State Management**: In-memory storage (MemStorage).

## External Dependencies
- **Spaceflight News API (SNAPI v4)**: For real-time astronomy and space exploration news.
- **WhatsApp Integration**: For direct messaging and community interaction.
- **Netlify**: For hosting, continuous deployment, SSL, CDN, and performance optimization.
- **Schema.org**: For JSON-LD structured data implementation.