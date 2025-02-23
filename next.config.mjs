/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "umjgevazwwzloftvzogi.supabase.co",
      "www.yutongdaily.com",
      "cdn.discordapp.com",
      "takethemameal.com",
      "lh3.googleusercontent.com",
    ],
  },
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
