import { Link } from "wouter";
import EditorialPage from "@/components/EditorialPage";
export default function NotFound() {
  return (
    <EditorialPage
      eyebrow="A different direction"
      title="This page is beyond our horizon."
      intro="The page you’re looking for isn’t here. There are still plenty of ways to explore."
    >
      <div className="reading-column">
        <Link className="action action-primary" href="/">
          Back to NightSky →
        </Link>{" "}
        <Link className="text-link" href="/resources">
          Explore Resources
        </Link>
      </div>
    </EditorialPage>
  );
}
