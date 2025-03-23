/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['gz.bcebos.com', 'ynnaiiamge.gz.bcebos.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.bcebos.com',
        port: '',
        pathname: '/**',
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
      },
      {
        source: '/api/bos-upload',
        destination: '/api/bos-upload',
      }
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  }
}

module.exports = nextConfig 