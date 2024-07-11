/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    const externals = ['gdal-async'];
    if (config.externals) config.externals.push(...externals);
    else config.externals = externals;
    return config;
  },
};

export default nextConfig;
