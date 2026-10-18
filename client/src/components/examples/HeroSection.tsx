import HeroSection from '../HeroSection';
import heroImage from '@assets/stock_images/starry_night_sky_met_675ba820.webp';

export default function HeroSectionExample() {
  return (
    <HeroSection
      image={heroImage}
      headline="Where Earth meets the stars."
      subheadline="Journey to the darkest skies on Earth to witness the brightest moments of the universe."
      primaryCTA="Explore Experiences"
      secondaryCTA="Join the Waitlist"
      onPrimaryCTAClick={() => console.log('Primary CTA clicked')}
      onSecondaryCTAClick={() => console.log('Secondary CTA clicked')}
    />
  );
}
