/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === "true"
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (isExport ? "/_telemetry" : "")

const nextConfig = {
  output: isExport ? "export" : undefined,
  distDir: isExport ? "out" : ".next",
  basePath,
  images: {
    unoptimized: true,
  },
  ...(isExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Strict-Transport-Security", value: "max-age=63072000" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
              ],
            },
          ]
        },
      }),
}

export default nextConfig
