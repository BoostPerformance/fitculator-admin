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
  images: {
    domains: ['www.yutongdaily.com', 'cdn.discordapp.com'],
  },
};

export default nextConfig;
