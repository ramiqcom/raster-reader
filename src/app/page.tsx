'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { Map } from 'maplibre-gl';
import { useEffect } from 'react';
import initGdalJs from 'gdal3.js';

export default function Home() {
  const mapDiv = 'map';

  const keyStadia = process.env.NEXT_PUBLIC_STADIA_KEY;
  const style = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${keyStadia}`;

  useEffect(() => {
    const map = new Map({
      container: mapDiv,
      center: [117, 0],
      zoom: 4,
      style: style,
    });

    initGdalJs().then(gdal => console.log('Yes'));
  });

  return <div id={mapDiv}></div>;
}
