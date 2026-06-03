/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permitir transpiling de paquetes workspace TS sin build previo
  transpilePackages: ['@erp/ui', '@erp/auth', '@erp/db', '@erp/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
