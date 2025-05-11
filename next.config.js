/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'myaisitebuilder.s3-website.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'myaisitebuilder.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
}

module.exports = nextConfig 