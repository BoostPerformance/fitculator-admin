/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
  webpack: (config, { isServer }) => {
    // 코드 스플리팅 최적화
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
          priority: 20,
          maxSize: 244000,
        },
        recharts: {
          name: 'recharts',
          test: /[\\/]node_modules[\\/]recharts[\\/]/,
          chunks: 'all',
          priority: 30,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'async',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    };

    // 메모리 최적화
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['recharts', '@tanstack/react-query', '@supabase/supabase-js'],
  },
};

export default nextConfig;