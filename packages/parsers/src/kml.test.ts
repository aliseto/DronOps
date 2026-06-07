import { describe, it, expect } from "vitest";
import { parseKml } from "./kml";

const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Placemark><name>Sur Al Lawatia</name><Point><coordinates>58.593,23.616,0</coordinates></Point></Placemark>
  <Placemark><name>Ghala AOI</name><Polygon><outerBoundaryIs><LinearRing><coordinates>
    58.40,23.58,0 58.41,23.58,0 58.41,23.59,0 58.40,23.59,0 58.40,23.58,0
  </coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
</Document></kml>`;

describe("parseKml", () => {
  it("extracts a point placemark as a location row", () => {
    const r = parseKml(KML);
    const sur = r.locations.find((l) => l.name === "Sur Al Lawatia");
    expect(sur).toEqual({ name: "Sur Al Lawatia", latitude: 23.616, longitude: 58.593 });
  });

  it("reduces a polygon to its centroid", () => {
    const r = parseKml(KML);
    const ghala = r.locations.find((l) => l.name === "Ghala AOI")!;
    expect(ghala.latitude).toBeCloseTo(23.584, 2);
    expect(ghala.longitude).toBeCloseTo(58.404, 2);
  });

  it("warns when there are no placemarks", () => {
    expect(parseKml("<kml></kml>").warnings.length).toBeGreaterThan(0);
  });

  it("rejects a KMZ (zip) payload with guidance", () => {
    expect(() => parseKml("PKrest-of-zip")).toThrow(/KMZ/);
  });
});
