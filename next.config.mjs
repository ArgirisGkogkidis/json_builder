/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: '/json_builder',
    assetPrefix: '/json_builder/',
    publicRuntimeConfig: {
        basePath: '/json_builder',
    },
};

export default nextConfig;
