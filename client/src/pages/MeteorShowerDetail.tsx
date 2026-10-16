import { useParams, Link } from "wouter";
import { legacyMeteorIds } from "@shared/meteorContent";
import EditorialPage from "@/components/EditorialPage";
import SEO from "@/components/SEO";
export default function MeteorShowerDetail() {
  const { id } = useParams();
  const known = legacyMeteorIds.includes(id || "");
  return (
    <>
      <EditorialPage
        noindex
        eyebrow="Meteor Showers"
        title={
          known ? "A record worth a closer look." : "Meteor record not found."
        }
        intro={
          known
            ? "This archived record is awaiting factual review. Explore our meteor-watching resources for general preparation."
            : "We couldn’t find that meteor record."
        }
      >
        <div className="reading-column">
          {known && (
            <p className="small-note">
              Archive reference: {id}. Dates, rates and local viewing claims are
              withheld until reviewed.
            </p>
          )}
          <Link className="action action-outline" href="/meteor-showers">
            Explore meteor showers →
          </Link>
        </div>
      </EditorialPage>
    </>
  );
}
