import { fromUrl } from 'geotiff';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { bboxMeters2Degrees, merc } from '../../../module/util';

export async function GET(req: NextRequest, { params }: { params: { url: string[] } }) {
  const { signal, abort } = new AbortController();

  const { url } = params;
  const length = url.length;
  const cogUrl = url.slice(0, length - 3).join('/');
  const [z, x, y] = url.slice(length - 3).map((s) => Number(s));
  const bbox = bboxMeters2Degrees(merc(x, y, z));
  const size = 256;

  try {
    const source = await fromUrl(cogUrl, {}, signal);
    const image = await source.getImage();
    const raster = (await image.readRasters({
      bbox,
      interleave: true,
      width: size,
      height: size,
      samples: [0, 1, 2],
      signal,
      fillValue: NaN,
    })) as Uint8Array;

    console.log(raster);

    const jpg = await sharp(new Uint8ClampedArray(raster), {
      raw: {
        width: size,
        height: size,
        channels: 3,
      },
    })
      .jpeg()
      .toBuffer();

    const type = 'image/png';

    return new NextResponse(jpg, {
      status: 200,
      headers: {
        'Content-Type': type,
      },
    });
  } catch ({ message }) {
    abort();
    return new NextResponse(null, { status: 404 });
  }
}
