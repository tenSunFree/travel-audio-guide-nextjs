/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Cloud Run deployment: output standalone server (.next/standalone/server.js)
  output: "standalone",
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS
    ? process.env.DEV_ALLOWED_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [],
};

export default nextConfig;
