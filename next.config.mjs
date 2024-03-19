import CopyPlugin from 'copy-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          { from: './node_modules/gdal3.js/dist/package/gdal3WebAssembly.wasm', to: 'static' },
          { from: './node_modules/gdal3.js/dist/package/gdal3WebAssembly.data', to: 'static' },
        ],
      }),
		);

		return config;
  },
};

export default nextConfig;
