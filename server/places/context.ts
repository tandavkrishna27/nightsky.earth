import { getLocationContextResultSchema, type PlaceRef } from "../../shared/nightsky/places";

/** Returns only the selected named-place provenance; unvalidated access and darkness data remain unknown. */
export async function getLocationContext(place: PlaceRef) {
  return getLocationContextResultSchema.parse({
    availability: { status: "partial", reason: "The named place is resolved, but no validated darkness or site-access source is configured." },
    sources: place.sources,
    caveats: ["Place-name records identify an area, not an observing site's access, safety or sky quality."],
    placeId: place.placeId,
    groundLightContext: { status: "unknown", reason: "Ground-light data has not passed source licensing, coverage and usefulness validation." },
    access: { status: "unknown", description: "Current public access, night opening, permits and safety have not been verified." },
  });
}
