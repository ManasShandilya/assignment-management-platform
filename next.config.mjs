/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "30mb" } },
  poweredByHeader: false,
};
export default nextConfig;
