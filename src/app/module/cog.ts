import { encode } from 'fast-png';
import { Pool, fromBlob } from 'geotiff';
import maplibregl, { RasterSourceSpecification } from 'maplibre-gl';

/**
 * transform x/y/z to webmercator-bbox
 * @param x
 * @param y
 * @param z
 * @returns {number[]} [minx, miny, maxx, maxy]
 */
const merc = (x: number, y: number, z: number): number[] => {
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
};

export const generateCogSource = async (
  input: Blob,
): Promise<{ source: RasterSourceSpecification }> => {
  const url = URL.createObjectURL(input);
  const tiff = await fromBlob(input);
  const pool = new Pool();

  maplibregl.addProtocol('cog', async (params) => {
    try {
      const segments = params.url.split('/');
      const [z, x, y] = segments.slice(segments.length - 3).map(Number);
      const bbox = merc(x, y, z);
      const size = 256;

      const data = await tiff.readRasters({
        bbox,
        samples: [0, 1, 2, 3], // 取得するバンドを指定
        width: size,
        height: size,
        interleave: true,
        pool,
      });

      const img = new ImageData(
        //@ts-ignore
        new Uint8ClampedArray(data),
        size,
        size,
      );
      const png = encode(img);

      return {
        data: png,
        cacheControl: null,
        expires: null,
      };
    } catch ({ message }) {
      throw new Error(message);
    }
  });

  const source: RasterSourceSpecification = {
    type: 'raster',
    tiles: [`cog://${url.split('://')[1]}/{z}/{x}/{y}`],
    tileSize: 256,
    minzoom: 8,
    maxzoom: 16, // 今回用いたCOGは19までの解像度を持っているようだが制限しておく
  };

  return { source };
};
