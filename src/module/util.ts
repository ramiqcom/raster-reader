import { GeoTIFFImage } from 'geotiff';

export function merc(x: number, y: number, z: number): number[] {
  // 参考: https://qiita.com/MALORGIS/items/1a9114dd090e5b891bf7
  const GEO_R = 6378137;
  const orgX = -1 * ((2 * GEO_R * Math.PI) / 2);
  const orgY = (2 * GEO_R * Math.PI) / 2;
  const unit = (2 * GEO_R * Math.PI) / Math.pow(2, z);
  const minx = orgX + x * unit;
  const maxx = orgX + (x + 1) * unit;
  const miny = orgY - (y + 1) * unit;
  const maxy = orgY - y * unit;
  return [minx, miny, maxx, maxy];
}

// source: https://gist.github.com/craigsc/fdb867f8971ff5b4ae42de4e0d7c229e
export function meters2Degrees(x: number, y: number): number[] {
  let lon = (x * 180) / 20037508.34;
  let lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
  return [lon, lat];
}

// source: https://gist.github.com/craigsc/fdb867f8971ff5b4ae42de4e0d7c229e
export function bboxMeters2Degrees(bbox: number[]): number[] {
  let swLatLng = meters2Degrees(bbox[0], bbox[1]);
  let neLatLng = meters2Degrees(bbox[2], bbox[3]);
  return [swLatLng[0], swLatLng[1], neLatLng[0], neLatLng[1]];
}

// source: https://gist.github.com/craigsc/fdb867f8971ff5b4ae42de4e0d7c229e
export async function getBboxInWebMercator(firstTile: GeoTIFFImage): Promise<number[]> {
  const bbox = firstTile.getBoundingBox();
  return bboxMeters2Degrees(bbox);
}
