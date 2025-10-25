# NightSky.earth - Curated Night-Sky Experiences

## Project Overview
A cinematic, minimalist website for NightSky.earth - a brand offering curated night-sky and meteor experiences. The design emphasizes emotion-first storytelling with a dark, cosmic aesthetic where "Earth meets the stars."

## Recent Updates (October 13, 2025)

### Complete 2025 & 2026 Meteor Shower Calendar (Latest)
- **Added full 2026 meteor shower calendar** - all 12 major showers
- **Meteor Nights page updated** with year tabs (2025 & 2026)
- Total of **24 meteor showers** across two years
- Each year includes:
  - Quadrantids, Lyrids, Eta Aquariids, Delta Aquariids
  - Perseids ⭐, Draconids, Orionids
  - Southern Taurids, Northern Taurids, Leonids
  - Geminids ⭐, Ursids
- **2026 Featured Showers:**
  - Perseids (August 12-13) - Excellent dark skies
  - Geminids (December 13-14) - Favorable moon conditions
- Smooth tab navigation between years
- All detail pages work for both 2025 and 2026 showers

### Comprehensive Resources Page
- **New Resources page** at `/resources` with complete stargazing information:
  
  **Mobile Apps Section:**
  - SkySafari - Professional planetarium app (iOS/Android)
  - Star Walk 2 - AR sky mapping (iOS/Android)
  - PhotoPills - Astrophotography planning (iOS/Android) ⭐ Recommended
  - Sky Tonight - Modern astronomy app (iOS/Android)
  - NASA App - Official space news and tracking (Free)
  
  **Desktop Software:**
  - Stellarium - Free open-source planetarium ⭐ Recommended
  - SkySafari Pro - Professional desktop version
  - Cartes du Ciel - Free with telescope control
  
  **Essential Web Resources:**
  - Weather: Clear Dark Sky, Astrospheric
  - Dark Sky Maps: Light Pollution Map ⭐, Dark Site Finder
  - Planning Tools: Time and Date Astronomy, CalSky
  - Satellite Tracking: Heavens Above ⭐
  - Education: Sky & Telescope, Astronomy.com
  - Conservation: International Dark-Sky Association ⭐
  
  **Essential Gear Guides:**
  - Beginner equipment checklist
  - Astrophotography gear recommendations
  
  **World's Best Dark Sky Locations:**
  - NamibRand Nature Reserve, Namibia
  - Mauna Kea, Hawaii, USA
  - Atacama Desert, Chile
  - Aoraki Mackenzie, New Zealand
  - **Almora, Uttarakhand, India** - Himalayan dark sky site
  - Cherry Springs State Park, Pennsylvania, USA
  - Jasper National Park, Alberta, Canada
  - Westhavelland, Germany
  - Warrumbungle National Park, Australia

### Time-Lapse Night Sky Videos
- **Video background support** added for cinematic hero sections
- Components created:
  - `VideoBackground` - Reusable video background component
  - `HeroSectionVideo` - Hero section with video support
- Features:
  - Auto-loop with slow motion (0.75x speed) for cinematic effect
  - Fallback to static image if video not available
  - Optimized for performance with proper video formats
  - Smooth overlay gradients
- **To add your own videos**:
  1. Download time-lapse night sky videos (MP4 format)
  2. Place in `/public/videos/` folder
  3. Reference in components: `videoUrl="/videos/your-video.mp4"`
- See `/public/videos/README.md` for video specs and free sources
- Home page already configured with video hero (falls back to image)

### Meteor Loader & Enhanced Animations
- **Clean meteor loader** added to ALL pages with 1-second delay
  - Removed background text for clean, minimal aesthetic
  - Features realistic flame trail with particle effects
  - Smooth diagonal movement across screen
  
- **Navigation Animations**:
  - Smooth slide-down on page load
  - Staggered fade-in for nav items
  - Rotating menu icon transitions
  - Smooth mobile menu slide animations
  - Logo hover scale effect

- **Hero Section Animations**:
  - Parallax scrolling on background images
  - Fade effect as you scroll down
  - Smooth text entrance animations with stagger
  - Button hover scale (1.05x) and tap feedback (0.95x)

- **Interactive Animations**:
  - All CTA buttons have smooth hover and tap animations
  - Cards already have smooth entrance animations
  - Mobile menu slides smoothly with staggered items

### Dynamic Meteor Shower Features
- **Homepage**: Dynamically displays the next 3 upcoming meteor showers based on the current date
- **Meteor Nights Page**: Shows all 12 meteor showers for 2025 with clickable cards
- **Individual Shower Details**: Each meteor shower has a dedicated detail page with comprehensive information including:
  - Peak viewing dates
  - Peak meteors per hour rate
  - Best viewing locations and visibility
  - Moon phase conditions
  - Radiant point constellation
  - Parent body (comet/asteroid)
  - Meteor velocity and difficulty level
  - Best viewing times

### Experience Status System
- **Active Experiences** (2):
  - Meteor Nights - Links to `/meteor-nights` showing all 2025 meteor showers
  - Cosmic Silence - Available for booking
  
- **Coming Soon Experiences** (4):
  - Dark Sky Treks
  - Eclipse Expeditions
  - Aurora Journeys
  - Astro-Photography Workshops

All "Coming Soon" experiences display badges and have disabled booking buttons.

## Key Pages

### 1. Home (`/`)
- Hero section with cosmic imagery
- Next 3 upcoming meteor showers (dynamic based on current date)
- Experience cards (2 active, 2 coming soon)
- Featured celestial events
- Call-to-action sections

### 2. Meteor Nights (`/meteor-nights`)
- Overview of all 24 meteor showers (12 in 2025 + 12 in 2026)
- Year tabs to switch between 2025 and 2026
- Clickable cards for each shower
- Featured badges for Perseids and Geminids
- What's Included section
- Booking CTA

### 3. Individual Meteor Shower (`/meteor-shower/:id`)
- Detailed information for specific meteor shower
- 8-card grid with comprehensive details:
  - Peak dates, rate, location, viewing time
  - Moon conditions, radiant point, parent body, velocity
- Featured/difficulty badges
- Booking options

### 4. Experiences (`/experiences`)
- All 6 experiences (2 active, 4 coming soon)
- Coming Soon badges displayed appropriately
- What to Expect section

### 5. About (`/about`)
- Brand story and philosophy

### 6. Science (`/science`)
- Educational content about celestial phenomena

### 7. Resources (`/resources`)
- Comprehensive stargazing apps, tools, and resources
- Mobile and desktop planetarium software
- Essential web resources (weather, dark sky maps, planning tools)
- Essential gear guides
- World's best dark sky locations

### 8. Contact (`/contact`)
- Contact form for inquiries and bookings

## Meteor Showers (2025 & 2026)

### 2025 Featured Showers
1. **Perseids** (August 12-13) - Up to 100 meteors/hour
2. **Geminids** (December 13-14) - Up to 120 meteors/hour

### 2026 Featured Showers
1. **Perseids** (August 12-13) - Up to 100 meteors/hour - Excellent conditions
2. **Geminids** (December 13-14) - Up to 120 meteors/hour - Favorable moon

### All 12 Showers (Each Year)
1. Quadrantids - January 3-4
2. Lyrids - April 22-23
3. Eta Aquariids - May 5-6
4. Delta Aquariids - July 28-29
5. Perseids - August 12-13 ⭐
6. Draconids - October 8-9
7. Orionids - October 21-22
8. Southern Taurids - November 4-5
9. Northern Taurids - November 11-12
10. Leonids - November 17-18
11. Geminids - December 13-14 ⭐
12. Ursids - December 21-22

**Total: 24 meteor showers across 2025 & 2026**

## Technical Architecture

### Data Structure
- **Centralized meteor shower data** in `shared/meteorShowers.ts`
- Arrays for:
  - `meteorShowers2025` - All 12 showers for 2025
  - `meteorShowers2026` - All 12 showers for 2026
  - `allMeteorShowers` - Combined array of all 24 showers
- Helper functions for:
  - `getUpcomingMeteorShowers(count)` - Returns next N upcoming showers from all years
  - `getMeteorShowerById(id)` - Returns specific shower details from all years

### Key Components
- `ExperienceCard` - Supports "Coming Soon" badges and conditional navigation
- `HeroSection` - Cinematic hero with image overlay and CTAs
- `ContentSection` - Reusable section wrapper
- `Navigation` - Responsive navigation (desktop from 768px/md breakpoint)
- `Footer` - Site-wide footer
- `MeteorLoader` - Animated meteor with flame trail loader (sm/md/lg sizes)
- `LoadingPage` - Full-page loading component with meteor animation

### Routing
```
/ - Home
/about - About
/experiences - All experiences
/meteor-nights - All meteor showers 2025
/meteor-shower/:id - Individual shower details
/science - Science content
/resources - Apps, tools, and resources
/contact - Contact form
```

## Design Philosophy
- **Emotion-first approach**: Emotion first, information second
- **Dark, cinematic aesthetic**: Cosmic colors, generous whitespace
- **Smooth interactions**: Parallax scrolling, subtle animations
- **Premium feel**: Serene, reflective, poetic language
- **Responsive design**: Mobile-first with tablet/desktop enhancements

## Technologies
- React + TypeScript
- Wouter (routing)
- Framer Motion (animations)
- Tailwind CSS + shadcn/ui
- Lucide React (icons)
- In-memory storage (MemStorage)

## Development Notes
- Navigation breakpoint changed from lg (1024px) to md (768px) for better tablet experience
- All meteor shower data stored in shared folder for frontend/backend consistency
- Dynamic date-based filtering ensures relevant meteor showers are always displayed
