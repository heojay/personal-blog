/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/dev/:slug',
        destination: '/posts/:slug',
        permanent: true,
      },
      {
        source: '/book/:slug',
        destination: '/posts/:slug',
        permanent: true,
      },
      {
        source: '/essay/:slug',
        destination: '/posts/:slug',
        permanent: true,
      }
    ];
  },
};

module.exports = nextConfig;
