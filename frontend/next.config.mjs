/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  async rewrites() {
    if (process.env.VERCEL) return [];
    return [{
      source: '/api/:path*',
      destination: 'http://localhost:4000/api/:path*',
    }];
  },
};

export default nextConfig;