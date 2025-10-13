import JournalCard from '../JournalCard';
import auroraImage from '@assets/stock_images/aurora_borealis_nort_b91defe5.jpg';

export default function JournalCardExample() {
  return (
    <div className="p-8 max-w-md">
      <JournalCard
        title="Dancing Lights of the North"
        excerpt="Our expedition to witness the aurora borealis revealed nature's most ethereal light show..."
        image={auroraImage}
        tag="Aurora"
        onClick={() => console.log('Journal card clicked')}
      />
    </div>
  );
}
