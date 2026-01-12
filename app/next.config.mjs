/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  env: {
    API_URL: 'http://127.0.0.1:8000/api/v1',
    LARAVEL_URL: 'http://127.0.0.1:8000',
    PUSHER_APP_CLUSTER: 'ap2',
    PUSHER_APP_KEY: 'XXXXXXXXXXXXXXXXXXXX',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  distDir: 'dist',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
