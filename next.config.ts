/** @type {import('next').NextConfig} */
import nextPWA from 'next-pwa';
const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});
const nextConfig = {
  output: 'standalone' as const,
  turbopack: {},
  async rewrites() {
    return [
      {
        source:'/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://144.126.133.43:4000'}/api/:path*`,
      },
    ];
  },
};

export default withPWA(nextConfig);