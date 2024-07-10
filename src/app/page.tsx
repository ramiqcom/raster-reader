'use client';

import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState } from 'react';

export default function Home() {
  const mapDiv = 'map';

  const keyStadia = process.env.NEXT_PUBLIC_STADIA_KEY;
  const style = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${keyStadia}`;

  const [map, setMap] = useState<Map>();
  const [loaded, setLoaded] = useState(false);

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
    if (map && loaded) {
      map.addSource('raster', {
        type: 'raster',
        tiles: ['/raster/data/{z}/{x}/{y}'],
        tileSize: 256,
      });

      map.addLayer({
        id: 'raster',
        source: 'raster',
        type: 'raster',
      });
    }
  }, [map, loaded]);

  return <div id={mapDiv}></div>;
}
