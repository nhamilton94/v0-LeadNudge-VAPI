/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@botpress/client']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure Node.js built-ins are available and don't bundle @botpress/client
      config.externals = config.externals || []
      config.externals.push('https', 'http', 'net', 'tls', '@botpress/client')
    }
    return config
  }
}

export default nextConfig