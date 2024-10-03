/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
