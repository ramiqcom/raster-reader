import 'node-self';

import { fromArrayBuffer } from 'geotiff';
import ee from '@google/earthengine';
import { authenticate, evaluate } from '../../module/gee';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.arrayBuffer();
  const data = await fromArrayBuffer(body);
  const image = await data.getImage();
  const raster = await image.readRasters();
	const { width, height } = raster;

	// Authenticate earth engine
	const key = process.env.EE_KEY;
	await authenticate(key);

	// Array
	console.log(raster[0]);
	const arr = ee.Array(raster[0]);
	console.log(await evaluate(arr));

  return NextResponse.json({}, { status: 200 });
}
