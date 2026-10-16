import EditorialPage from "@/components/EditorialPage";
import { collectiveSections } from "@/content/websiteCopy";
import image from "@assets/stock_images/person_silhouette_st_c7feb986.jpg";
export default function Community() {
  return (
    <EditorialPage
      eyebrow="The Collective"
      title="For everyone who looks up."
      intro="Different places, different experience, the same curiosity. The Collective is the community we want to grow around the night sky."
      image={image}
    >
      <div className="reading-column">
        {collectiveSections.map(([title, body], i) => (
          <section key={title}>
            <p className="eyebrow">0{i + 1}</p>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
        <p className="closing-thought">
          A shared sky.
          <br />
          Many ways to experience it.
        </p>
      </div>
    </EditorialPage>
  );
}
