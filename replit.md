# NightSky.earth - Curated Night-Sky Experiences

## Project Overview
A cinematic, minimalist website for NightSky.earth - a brand offering curated night-sky and meteor experiences. The design emphasizes emotion-first storytelling with a dark, cosmic aesthetic where "Earth meets the stars."

## Recent Updates (October 13, 2025)

### Meteor Loader (Latest)
- **Beautiful animated meteor loader** added to ALL pages with 1-second delay
- Loader features realistic flame trail with particle effects
- Custom loading messages for each page:
  - Home: "Where Earth meets the stars..."
  - About: "Born of Earth. Guided by Stars..."
  - Experiences: "Preparing your cosmic journey..."
  - Meteor Nights: "Mapping the night sky for 2025..."
  - Meteor Shower Detail: "Calculating celestial trajectories..."
  - Science: "The Universe, Explained Beautifully..."
  - Journal: "Moments Beneath the Infinite..."
  - Contact: "Let's find your perfect celestial journey..."

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
- Overview of all 12 meteor showers in 2025
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

### 7. Journal (`/journal`)
- Stories and experiences from past journeys

### 8. Contact (`/contact`)
- Contact form for inquiries and bookings

## 2025 Meteor Showers

### Featured Showers
1. **Perseids** (August 12-13) - Up to 100 meteors/hour
2. **Geminids** (December 13-14) - Up to 120 meteors/hour

### All 12 Showers
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

## Technical Architecture

### Data Structure
- **Centralized meteor shower data** in `shared/meteorShowers.ts`
- Helper functions for:
  - `getUpcomingMeteorShowers(count)` - Returns next N upcoming showers
  - `getMeteorShowerById(id)` - Returns specific shower details

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
/journal - Journal entries
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
