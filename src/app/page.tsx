'use client';

import { fromUrl } from 'geotiff';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState } from 'react';
import { bboxMeters2Degrees } from '../module/util';

export default function Home() {
  const mapDiv = 'map';

  const keyStadia = process.env.NEXT_PUBLIC_STADIA_KEY;
  const style = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${keyStadia}`;

  const [map, setMap] = useState<Map>();
  const [loaded, setLoaded] = useState(false);
  const [url, setUrl] = useState(
    'https://storage.googleapis.com/gee-ramiqcom-bucket/cog/landsat_sembilang_2023_567.tif',
  );

  async function loadRaster() {
    const bounds = (await (await fromUrl(url)).getImage()).getBoundingBox();
    const boundsGeo = bboxMeters2Degrees(bounds) as [number, number, number, number];
    map.fitBounds(boundsGeo);

    map.addSource('raster', {
      type: 'raster',
      tiles: [`cog/${url}/{z}/{x}/{y}`],
      tileSize: 256,
      bounds: boundsGeo,
    });

    map.addLayer({
      id: 'raster',
      source: 'raster',
      type: 'raster',
    });
  }

  useEffect(() => {
    const map = new Map({
      container: mapDiv,
      center: [116.833, -1.262],
      zoom: 10,
      style: style,
    });
    setMap(map);

    map.on('load', () => setLoaded(true));
  }, []);

  useEffect(() => {
    if (map && loaded && url) {
      loadRaster();
    }
  }, [map, loaded, url]);

  return <div id={mapDiv}></div>;
}
