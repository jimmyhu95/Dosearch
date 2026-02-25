import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 服务端外部包配置
  serverExternalPackages: ['better-sqlite3'],
  
  // 实验性功能
  experimental: {
    // 服务器操作
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // 图片配置
  images: {
    remotePatterns: [],
  },
  
  // 重定向配置
  async redirects() {
    return [];
  },
  
  // 重写配置
  async rewrites() {
    return [];
  },
};

export default nextConfig;
