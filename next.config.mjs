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
    domains: [
      'umjgevazwwzloftvzogi.supabase.co',
      'www.yutongdaily.com',
      'cdn.discordapp.com',
      'takethemameal.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'takethemameal.com',
        port: '',
        pathname: '/files_images_v2/**',
      },
    ],
  },
};

export default nextConfig;
