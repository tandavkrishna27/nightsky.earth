import ExperienceCard from '../ExperienceCard';
import desertImage from '@assets/stock_images/desert_dunes_night_s_ee2f17ac.webp';

export default function ExperienceCardExample() {
  return (
    <div className="p-8 max-w-md">
      <ExperienceCard
        title="Meteor Nights"
        description="Watch celestial showers paint the desert skies."
        image={desertImage}
        season="August–December"
        duration="3 nights"
        onLearnMore={() => console.log('Learn more clicked')}
      />
    </div>
  );
}
