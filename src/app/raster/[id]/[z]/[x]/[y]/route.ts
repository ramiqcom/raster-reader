import { encode } from 'fast-png';
import { fromUrl, GeoTIFFImage } from 'geotiff';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; z: string; x: string; y: string } },
) {
  const { signal, abort } = new AbortController();

  try {
    let { id, x, y, z } = params;
    const zoom = Number(z);
    const xCoord = Number(x);
    const yCoord = Number(y.split('.')[0]);

    const bbox = merc(xCoord, yCoord, zoom);
    const bboxGeo = bboxMeters2Degrees(bbox);
    const size = 256;

    const url =
      'https://storage.googleapis.com/fa-rs-bucket/landsat/L89_Kalimantan_2023_v1_RGB_Balikpapan.tif';

    const source = await fromUrl(url, {}, signal);

    const image = await source.getImage();

    const bounds = image.getBoundingBox();
    console.log(`BBOX: ${bboxGeo}`, `Bounds ${bounds}`);

    const raster = await image.readRasters({
      bbox: bboxGeo,
      interleave: true,
      width: size,
      height: size,
      samples: [0, 1, 2],
      signal,
      fillValue: NaN,
    });

    const png = encode({
      data: new Uint8ClampedArray(new Uint8ClampedArray(raster as Uint8Array)),
      width: size,
      height: size,
      channels: 3,
    });

    const type = 'image/png';

    return new NextResponse(png, {
      status: 200,
      headers: {
        'Content-Type': type,
      },
    });
  } catch ({ message }) {
    abort();
    return NextResponse.json({}, { status: 404 });
  }
}

function merc(x: number, y: number, z: number): number[] {
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
function meters2Degrees(x: number, y: number): number[] {
  let lon = (x * 180) / 20037508.34;
  let lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
  return [lon, lat];
}

// source: https://gist.github.com/craigsc/fdb867f8971ff5b4ae42de4e0d7c229e
function bboxMeters2Degrees(bbox: number[]): number[] {
  let swLatLng = meters2Degrees(bbox[0], bbox[1]);
  let neLatLng = meters2Degrees(bbox[2], bbox[3]);
  return [swLatLng[0], swLatLng[1], neLatLng[0], neLatLng[1]];
}

// source: https://gist.github.com/craigsc/fdb867f8971ff5b4ae42de4e0d7c229e
async function getBboxInWebMercator(firstTile: GeoTIFFImage): Promise<number[]> {
  const bbox = firstTile.getBoundingBox();
  return bboxMeters2Degrees(bbox);
}
