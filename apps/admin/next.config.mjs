/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@erp/db', '@erp/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};
export default nextConfig;
