/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['aip.baidubce.com', 'gz.bcebos.com', 'ynnaiiamge.gz.bcebos.com'], // 更新百度云存储域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 允许所有域名的图片（生产环境建议限制）
      },
    ],
  },
  // 确保开发服务器支持热重载
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 启用Fast Refresh
      config.optimization.runtimeChunk = 'single';
    }
    return config;
  },
  // 将BOS配置暴露给客户端
  env: {
    NEXT_PUBLIC_BAIDU_BOS_ENDPOINT: process.env.BAIDU_BOS_ENDPOINT || 'https://gz.bcebos.com',
    NEXT_PUBLIC_BAIDU_BOS_BUCKET: process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge',
    NEXT_PUBLIC_BAIDU_BOS_DOMAIN: process.env.BAIDU_BOS_DOMAIN || 'ynnaiiamge.gz.bcebos.com',
  },
  async rewrites() {
    return [
      {
        source: '/api/baidu/:path*',
        destination: '/api/baidu/:path*',
      }
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

module.exports = nextConfig 