/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 768, 1024, 1200],
  },
  // Compress for slow 3G/4G
  compress: true,
  // Allow API calls to backend
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
