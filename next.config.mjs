// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // SOLUÇÃO: Força o uso do Webpack (compilador mais estável)
  webpack: (config, { isServer }) => {
    return config; // Usar a função webpack desativa o Turbopack
  },
  
  // Removemos todas as opções problemáticas como swcMinify/experimental.

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;