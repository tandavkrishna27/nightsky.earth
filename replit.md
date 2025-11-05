# NightSky.earth - Curated Night-Sky Experiences

## Overview
NightSky.earth is a brand offering curated night-sky and meteor experiences through a cinematic, minimalist website. The project aims to provide an emotion-first storytelling experience with a dark, cosmic aesthetic, connecting Earth to the stars. Key capabilities include showcasing meteor shower calendars, providing comprehensive stargazing resources, facilitating community collaboration, and offering a dynamic astronomy news section. The platform emphasizes a premium feel, serene design, and poetic language to evoke wonder and facilitate immersive celestial experiences.

## User Preferences
I want the agent to use simple language and provide detailed explanations when necessary. I prefer an iterative development approach, where changes are discussed and approved before implementation. The agent should prioritize maintaining the dark, cinematic aesthetic and smooth animations. I want to be asked before any major architectural changes are made or new external dependencies are introduced.

## System Architecture
The project is built with a minimalist and cinematic design philosophy, prioritizing emotion-first storytelling and a dark, cosmic aesthetic. The UI/UX emphasizes generous whitespace, cosmic color palettes, parallax scrolling, and subtle animations for smooth interactions.

**Technical Implementations & Features:**
- **Dynamic Content**: Displays upcoming meteor showers based on the current date, and a comprehensive 2025/2026 meteor shower calendar.
- **Experience Status System**: Differentiates between "Active" and "Coming Soon" experiences with appropriate badging and CTAs.
- **Astronomy News Section**: Integrates real-time astronomy news with grid layout, search, source filters, and pagination.
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