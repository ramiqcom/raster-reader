import { fromUrl, GeoTIFFImage, ReadRasterResult } from 'geotiff';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; z: string; x: string; y: string } },
) {
  let { id, x, y, z } = params;
  const zoom = Number(z);
  const xCoord = Number(x);
  const yCoord = Number(y.split('.')[0]);

  const file = await fromUrl(
    'https://storage.googleapis.com/fa-rs-bucket/landsat/L89_Kalimantan_2023_v1_RGB_Balikpapan.tif',
  );

  const image = await file.getImage();

  const bbox = await getBboxInWebMercator(merc(xCoord, yCoord, zoom));
  console.log(bbox);
  const size = 256;

  const raster = Buffer.from(
    (await image.readRasters({
      bbox,
      samples: [0, 1, 2],
      width: size,
      height: size,
      interleave: true,
    })) as Uint8Array,
  );

  const jpg = await sharp(raster, {
    raw: {
      width: size,
      height: size,
      channels: 3,
    },
  })
    .jpeg()
    .toBuffer();

  const type = 'image/jpeg';

  return new NextResponse(jpg, { status: 200, headers: { 'Content-Type': type } });
}

const merc = (x: number, y: number, z: number): number[] => {
  // explanation of logic: https://qiita.com/MALORGIS/items/1a9114dd090e5b891bf7
  const GEO_R = 6378137;
  const orgX = -1 * ((2 * GEO_R * Math.PI) / 2);
  const orgY = (2 * GEO_R * Math.PI) / 2;
  const unit = (2 * GEO_R * Math.PI) / Math.pow(2, z);
  const minx = orgX + x * unit;
  const maxx = orgX + (x + 1) * unit;
  const miny = orgY - (y + 1) * unit;
  const maxy = orgY - y * unit;
  return [minx, miny, maxx, maxy];
};

async function getBboxInWebMercator(
  firstTile: GeoTIFFImage,
): Promise<[number, number, number, number]> {
  const bbox = firstTile.getBoundingBox() as [number, number, number, number];
  const epsgCode = firstTile.geoKeys.GeographicTypeGeoKey;
  // TODO: figure out projection bullshit
  if (!epsgCode) {
    // no code?! fallback to just assuming it's already in web-mercator
    return bboxMeters2Degrees(bbox);
  }
  return bboxMeters2Degrees(bbox);
  /*
    const epsg = `EPSG:${epsgCode}`;
    if (!proj4.defs(epsg)) {
        console.warn(`Loading missing proj4 definition for ${epsg}...`);
        const response = await fetch(`https://epsg.io/${epsgCode}.proj4`);
        proj4.defs(epsg, await response.text());
    }
    proj4.Point
    console.log(`origin: ${firstTile.getOrigin()}`);
    console.log(`bbox: ${firstTile.getBoundingBox()}`);
    console.log(`SW: ${bbox[0]}, ${bbox[1]}`)
    const transform = proj4(epsg, 'EPSG:3857', [bbox[1], bbox[0]]);
    console.log(`Transforms to ${transform}`);
    console.log(`degrees:  ${meters2Degrees(transform[0], transform[1])}`);
    const northeastLatLng = proj4(epsg, 'EPSG:3857', [latlngog[3], latlngog[2]]);
    const sw = meters2Degrees(southwestLatLng[0], southwestLatLng[1]);
    const ne = meters2Degrees(northeastLatLng[0], northeastLatLng[1]);
    console.log(sw.concat(ne));
    return sw.concat(ne);
    */
}

function bboxMeters2Degrees(
  bbox: [number, number, number, number],
): [number, number, number, number] {
  let swLatLng = meters2Degrees(bbox[0], bbox[1]);
  let neLatLng = meters2Degrees(bbox[2], bbox[3]);
  return [swLatLng[0], swLatLng[1], neLatLng[0], neLatLng[1]];
}

function meters2Degrees(x: number, y: number) {
  let lon = (x * 180) / 20037508.34;
  let lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
  return [lon, lat];
}

// TODO: explore faster conversion? https://github.com/brion/yuv-canvas/blob/main/src/YCbCr.js
function fromYCbCr(yCbCrRaster: ReadRasterResult) {
  const { width, height } = yCbCrRaster;
  const rgbRaster = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < yCbCrRaster.length; i += 3, j += 4) {
    const y = yCbCrRaster[i] as number;
    const cb = yCbCrRaster[i + 1] as number;
    const cr = yCbCrRaster[i + 2] as number;

    rgbRaster[j] = y + 1.402 * (cr - 0x80);
    rgbRaster[j + 1] = y - 0.34414 * (cb - 0x80) - 0.71414 * (cr - 0x80);
    rgbRaster[j + 2] = y + 1.772 * (cb - 0x80);
    // nodata when y, cr, and cb === 255
    rgbRaster[j + 3] = y === 255 && cb === 255 && cr === 255 ? 0 : 255;
  }
  return rgbRaster;
}
