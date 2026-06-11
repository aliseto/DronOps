// Flight-log parsers (M6). CSV flight-record / Airdata export → normalized
// ParsedFlight; native DJI Fly .txt records via dji-txt (keychain-gated v13+).
export {
  parseFlightCsv,
  parseDjiDat,
  type ParsedFlight,
  type TrackPoint,
} from "./flight-log";
export {
  detectDjiFlightRecord,
  parseDjiTxt,
  readDjiTxtDetails,
  type DjiTxtDetection,
  type ParseDjiTxtOptions,
} from "./dji-txt";

// KML AOI → permitted-location rows (M4). KMZ (zip) deferred.
export { parseKml, type KmlLocation, type ParsedKml } from "./kml";
