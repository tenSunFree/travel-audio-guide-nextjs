/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS
    ? process.env.DEV_ALLOWED_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [],
};

export default nextConfig;
