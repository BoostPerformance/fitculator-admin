/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
