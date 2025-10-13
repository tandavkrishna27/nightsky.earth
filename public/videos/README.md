# Night Sky Time-Lapse Videos

## Where to Place Videos

Add your time-lapse night sky videos to this directory (`/public/videos/`).

## Recommended Video Formats

- **Format**: MP4 (H.264 codec)
- **Resolution**: 1920x1080 (Full HD) or 3840x2160 (4K)
- **Frame Rate**: 24fps or 30fps
- **Duration**: 10-30 seconds (looped)
- **File Size**: Keep under 10MB for optimal loading

## Suggested Video Types

1. **Milky Way Time-Lapse** - `milky-way.mp4`
   - Rising Milky Way over landscape
   - Stars moving across the sky

2. **Star Trails** - `star-trails.mp4`
   - Circular star trails around Polaris
   - Long exposure effect

3. **Meteor Shower** - `meteor-shower.mp4`
   - Meteors streaking across sky
   - Night sky with shooting stars

4. **Aurora Borealis** - `aurora.mp4`
   - Northern lights dancing
   - Green/purple aurora waves

## Free Stock Video Sources

- [Pexels Videos](https://www.pexels.com/videos/) - Free night sky footage
- [Pixabay Videos](https://pixabay.com/videos/) - Free time-lapse videos
- [Videvo](https://www.videvo.net/) - Free stock video library
- [Coverr](https://coverr.co/) - Beautiful free videos

## Usage in Code

Videos are automatically loaded from `/videos/` directory:

```tsx
<HeroSectionVideo
  videoUrl="/videos/milky-way.mp4"
  fallbackImage={fallbackImage}
  headline="Your Headline"
  subheadline="Your Subheadline"
/>
```

## Current Implementation

The website is ready to use video backgrounds. Simply:
1. Download night sky time-lapse videos
2. Place them in `/public/videos/`
3. They will automatically display as hero backgrounds
