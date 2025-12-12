/** @type {import('next').NextConfig} */
const nextConfig = {
  // Completely disable worker-based features
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: false,
  optimizeFonts: false,
  compress: false,
  // Force single-threaded operation
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Disable all optimizations that might use workers
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
        minimize: false,
        usedExports: false,
        sideEffects: false,
      };
      // Force single core usage
      config.parallelism = 1;
      // Disable cache that might use workers
      config.cache = false;

      // Force Jest worker to use only 1 worker
      process.env.JEST_WORKER_ID = '1';

      // Disable any worker-based loaders
      config.module.rules.forEach(rule => {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach(loader => {
            if (typeof loader === 'object' && loader.options) {
              loader.options.worker = false;
              loader.options.parallel = false;
            }
          });
        }
      });
    }
    return config;
  },
  // Disable experimental features
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Additional worker disabling
  env: {
    JEST_WORKER_ID: '1',
  },
};

export default nextConfig;
