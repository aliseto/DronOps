// Flight-log parsers (M6). CSV flight-record / Airdata export → normalized
// ParsedFlight; the encrypted DJI .DAT decoder is held until real-log validation.
export {
  parseFlightCsv,
  parseDjiDat,
  type ParsedFlight,
  type TrackPoint,
} from "./flight-log";

// KML AOI → permitted-location rows (M4). KMZ (zip) deferred.
export { parseKml, type KmlLocation, type ParsedKml } from "./kml";
