'use client';

import { fromBlob } from 'geotiff';
import { LngLatBoundsLike, Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState } from 'react';
import { generateCogSource } from './module/cog';

export default function Home() {
  const mapDiv = 'map';

  const keyStadia = process.env.NEXT_PUBLIC_STADIA_KEY;
  const style = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${keyStadia}`;

  const [map, setMap] = useState<Map>();

  useEffect(() => {
    window.ondragover = (e: DragEvent) => e.preventDefault();
    window.ondrop = async (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      const data = await fromBlob(file);
      const image = await data.getImage();
      const bounds = image.getBoundingBox();

      const { source } = await generateCogSource(file);
      map.addSource('image', source);
      map.addLayer({
        source: 'image',
        id: 'image',
        type: 'raster',
      });

      map.fitBounds(bounds as LngLatBoundsLike);
    };

    const map = new Map({
      container: mapDiv,
      center: [119, 0],
      zoom: 4,
      style: style,
    });
    setMap(map);
  }, []);

  return <div id={mapDiv}></div>;
}
