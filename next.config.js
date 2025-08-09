/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/dev/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
      {
        source: '/book/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
      {
        source: '/essay/:slug',
        destination: '/blog/:slug',
        permanent: true,
      }
    ];
  },
};

module.exports = nextConfig;
