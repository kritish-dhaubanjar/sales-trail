/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  env: {
    API_URL: 'http://127.0.0.1:8000/api/v1',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  distDir: 'dist',
  trailingSlash: true,
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
