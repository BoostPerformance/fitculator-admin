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
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname]
        : []
      ),
      "www.yutongdaily.com",
      "cdn.discordapp.com",
      "takethemameal.com",
      "lh3.googleusercontent.com",
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: false,
  },
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['recharts', '@tanstack/react-query', '@supabase/supabase-js'],
  },
};

export default nextConfig;