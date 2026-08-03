/** @type {import('next').NextConfig} */
const nextConfig = {
  // When a Go API is added later, you can configure rewrites here to forward /api/* to the Go backend,
  // or use the NEXT_PUBLIC_API_BASE_URL environment variable directly in fetch calls.
  // async rewrites() {
  //   return [{ source: "/api/:path*", destination: `${process.env.GO_API_BASE_URL}/:path*` }];
  // },
};

export default nextConfig;
