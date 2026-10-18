# 🌌 NightSky.earth

> **Where Earth meets the stars.**

A cinematic, minimalist website for curated night-sky and meteor experiences. Built with emotion-first storytelling and a dark, cosmic aesthetic.

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-BADGE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)

## 🌠 Overview

NightSky.earth is a premium platform connecting people with the cosmos through immersive night-sky journeys. We collaborate with astronomers, astrophotographers, and educators to create unforgettable celestial experiences—from meteor shower camps to aurora expeditions and astrophotography workshops.

**Live Demo:** [nightsky.earth](https://nightsky.earth) *(Update with your Netlify URL)*

## ✨ Features

### 🎯 Core Features
- **Meteor Shower Calendar**: Complete 2025 & 2026 calendar with 24 major meteor showers
- **Curated Experiences**: 6 unique night-sky experiences (2 active, 4 coming soon)
- **Community Hub**: The Collective - collaboration network for astronomers and educators
- **Comprehensive Resources**: Apps, tools, guides, and dark sky locations worldwide
- **Dynamic Event Pages**: Detailed information for each meteor shower with peak times, rates, and viewing conditions

### 🎨 Design & UX
- **Emotion-First Design**: Poetic, reflective language with generous whitespace
- **Dark Cosmic Aesthetic**: Carefully crafted color palette inspired by the night sky
- **Smooth Animations**: Framer Motion powered interactions and parallax scrolling
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
- **Fixed Bottom Navigation**: Mobile/tablet navigation for easy access (auto-hides on desktop)
- **Meteor Loader**: Custom 1-second meteor animation on all page transitions

### 🔍 SEO & Discoverability
- **Complete SEO Infrastructure**: Meta tags, Open Graph, Twitter Cards on all pages
- **Schema.org Markup**: Rich structured data (Organization, Event, AboutPage, etc.)
- **Search Engine Optimization**: Unique titles, descriptions, and keywords per page
- **Sitemap & Robots.txt**: Full search engine crawling support
- **Social Media Ready**: Optimized sharing for Facebook, Twitter, LinkedIn

### ♿ Accessibility
- **Descriptive Alt Text**: All images have meaningful descriptions
- **ARIA Attributes**: Proper accessibility attributes throughout
- **Semantic HTML**: Clean, semantic structure
- **Keyboard Navigation**: Full keyboard support
- **Test IDs**: Comprehensive data-testid attributes for testing

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI library
- **TypeScript 5.6** - Type safety
- **Vite 5.4** - Build tool and dev server
- **Wouter 3.3** - Lightweight routing
- **TanStack Query 5.x** - Data fetching and caching
- **Framer Motion 11.x** - Animations and interactions
- **React Helmet Async 2.x** - SEO meta tags management

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **shadcn/ui** - Reusable component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Icons** - Additional icons (company logos)

### Backend (Development)
- **Express 4.x** - Node.js server
- **Drizzle ORM** - Type-safe database queries
- **Zod** - Schema validation
- **In-Memory Storage** - Development data storage

### Development Tools
- **tsx** - TypeScript execution
- **esbuild** - Fast bundling
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## 📁 Project Structure

```
nightsky.earth/
├── client/                     # Frontend application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── SEO.tsx       # SEO component
│   │   │   ├── Navigation.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ExperienceCard.tsx
│   │   │   ├── MeteorLoader.tsx
│   │   │   └── BottomNavigation.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── About.tsx
│   │   │   ├── Experiences.tsx
│   │   │   ├── MeteorNights.tsx
│   │   │   ├── MeteorShowerDetail.tsx
│   │   │   ├── Community.tsx
│   │   │   ├── Resources.tsx
│   │   │   └── Contact.tsx
│   │   ├── lib/              # Utilities and configs
│   │   ├── hooks/            # Custom React hooks
│   │   ├── App.tsx           # Root component
│   │   └── index.css         # Global styles
│   └── index.html            # HTML entry point
├── server/                    # Backend application
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API routes
│   ├── storage.ts            # Storage interface
│   └── vite.ts               # Vite integration
├── shared/                    # Shared code
│   ├── meteorShowers.ts      # Meteor shower data
│   └── schema.ts             # Database schemas
├── attached_assets/           # Images and media
│   └── stock_images/         # Stock photography
├── public/                    # Static files
│   ├── robots.txt            # Search engine rules
│   └── sitemap.xml           # Site structure
├── netlify.toml              # Netlify configuration
├── vite.config.ts            # Vite configuration
├── tailwind.config.ts        # Tailwind configuration
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 20+** (LTS version recommended)
- **npm** or **yarn** or **pnpm**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nightsky.earth.git
   cd nightsky.earth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   ```bash
   cp .env.example .env
   ```
   
   Add any required environment variables:
   ```env
   SESSION_SECRET=your-secret-key-here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5000
   ```

### Development Scripts

```bash
# Start development server (frontend + backend)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database migrations (if using database)
npm run db:push
```

## Deployment

The configured deployment host is Netlify. Its publication build is `npm run build:release`, which stops until the required operator, hosting, privacy, source, content-rights and policy facts are confirmed. See [`docs/website/release-checklist.md`](docs/website/release-checklist.md) before publishing.

`npm run build` creates a local preview with `noindex` metadata and a blocked `robots.txt`. Do not publish that preview build. Netlify uses the gated release build so it cannot accidentally publish that preview.

## 📊 Meteor Shower Data

### 2025 & 2026 Calendar

The application features all 24 major meteor showers:

**Featured Showers:**
- **Perseids** (August 12-13) - Up to 100 meteors/hour ⭐
- **Geminids** (December 13-14) - Up to 120 meteors/hour ⭐

**All Showers:**
1. Quadrantids (January)
2. Lyrids (April)
3. Eta Aquariids (May)
4. Delta Aquariids (July)
5. Perseids (August) ⭐
6. Draconids (October)
7. Orionids (October)
8. Southern Taurids (November)
9. Northern Taurids (November)
10. Leonids (November)
11. Geminids (December) ⭐
12. Ursids (December)

### Data Structure

Meteor shower data includes:
- Peak viewing dates
- Meteors per hour rate
- Best viewing locations
- Moon phase conditions
- Radiant constellation
- Parent comet/asteroid
- Meteor velocity
- Difficulty level

## 🎨 Design Philosophy

### Emotion-First Approach
- **Primary**: Evoke wonder and connection with the cosmos
- **Secondary**: Provide practical information
- **Tertiary**: Drive bookings and engagement

### Color Palette
- **Dark Cosmic Background**: Deep blues and blacks
- **Accent Colors**: Subtle purples and teals inspired by nebulae
- **Text Hierarchy**: Three levels of contrast for information hierarchy

### Typography
- **Serif Headings**: Poetic, classical feel
- **Sans-serif Body**: Clean, readable content
- **Generous Spacing**: Breathing room for contemplation

### Interactions
- **Smooth Animations**: Framer Motion for fluid transitions
- **Parallax Scrolling**: Depth and immersion
- **Hover Effects**: Subtle elevation and scale
- **Loading States**: Custom meteor loader

## 🔧 Technical Highlights

### SEO Implementation
- **React Helmet Async**: Dynamic meta tags per page
- **Schema.org JSON-LD**: Rich structured data
- **Open Graph**: Optimized social media sharing
- **Sitemap**: All pages indexed
- **Robots.txt**: Proper crawler directives

### Performance Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Responsive images with proper formats
- **Lazy Loading**: Components load on demand
- **Caching Strategy**: Aggressive caching for static assets

### Responsive Design
- **Mobile-First**: Designed for small screens first
- **Breakpoints**: 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Bottom Navigation**: Mobile/tablet only (auto-hides on desktop)

### Data Management
- **TanStack Query**: Efficient data fetching and caching
- **In-Memory Storage**: Development environment
- **Type Safety**: Full TypeScript coverage

## 🧪 Testing

### Test IDs
All interactive elements have `data-testid` attributes for testing:

```typescript
// Examples
data-testid="button-primary-cta"
data-testid="card-meteor-perseids"
data-testid="input-email"
data-testid="link-about"
```

### Testing Tools (Recommended)
- **Playwright** - E2E testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing

## 📝 Content Management

### Adding New Meteor Showers

Edit `shared/meteorShowers.ts`:

```typescript
export const meteorShowers2025: MeteorShower[] = [
  {
    id: "new-shower",
    name: "New Meteor Shower",
    peakDate: "Month DD-DD, 2025",
    peakDateStart: "2025-MM-DD",
    peakDateEnd: "2025-MM-DD",
    ratePerHour: "Up to XX",
    bestLocation: "Hemisphere",
    description: "Description here",
    radiant: "Constellation Name",
    moonPhase: "Moon phase info",
    bestViewingTime: "Time range",
    visibility: "Visibility info",
    parentBody: "Comet/Asteroid name",
    velocity: "XX km/s",
    difficulty: "Easy/Moderate/Difficult",
    featured: false // Set to true for featured showers
  }
];
```

### Adding New Experiences

Edit the experiences array in `client/src/pages/Home.tsx` or `client/src/pages/Experiences.tsx`.

### Updating Resources

Edit `client/src/pages/Resources.tsx` to add new apps, tools, or dark sky locations.

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow existing TypeScript patterns
- Use Tailwind CSS for styling
- Maintain emotion-first design language
- Add data-testid to interactive elements
- Write descriptive commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- **Meteor Shower Data**: International Meteor Organization
- **Stock Photography**: Pexels contributors
- **Icons**: Lucide React & React Icons
- **UI Components**: shadcn/ui & Radix UI
- **Inspiration**: The cosmos and everyone who looks up

## 📞 Contact

- **Website**: [nightsky.earth](https://nightsky.earth)
- **Email**: hello@nightsky.earth
- **WhatsApp**: [Join the Community](https://wa.me/YOUR_PHONE_NUMBER)

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Core website with 8 pages
- [x] Meteor shower calendar (2025-2026)
- [x] SEO optimization
- [x] Responsive design
- [x] Netlify deployment ready

### Phase 2: Enhancement 🚧
- [ ] Backend API integration
- [ ] User authentication
- [ ] Booking system
- [ ] Email notifications
- [ ] Blog/Journal section

### Phase 3: Community 📅
- [ ] User accounts
- [ ] Community forums
- [ ] Event hosting platform
- [ ] Photo gallery submissions
- [ ] Educator dashboard

### Phase 4: Advanced 🔮
- [ ] Mobile app (React Native)
- [ ] Real-time meteor shower tracking
- [ ] Live stream integrations
- [ ] AR sky mapping
- [ ] AI-powered location recommendations

---

**Built with 🌠 by astronomers, for star lovers.**

*Last updated: October 26, 2025*
