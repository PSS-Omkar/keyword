import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: "mock-api",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!process.env.USE_MOCK_API) return next();
          const url = req.url || "";
          if (!url.startsWith("/api")) return next();
          res.setHeader("Content-Type", "application/json");
          try {
            if (url.startsWith("/api/auth/user")) {
              res.end(JSON.stringify({ id: "demo-user", email: "demo@example.com", firstName: "Demo", lastName: "User" }));
              return;
            }
            if (url.startsWith("/api/stats")) {
              res.end(JSON.stringify({ totalProjects: 1, activeCampaigns: 0, advertisers: 2, countries: 4 }));
              return;
            }
            if (url.startsWith("/api/projects")) {
              res.end(JSON.stringify([{ id: 1, name: "Demo Project", description: "Mock project", status: "active", topics: ["marketing", "seo"], countries: ["US"], languages: ["EN"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), advertiserId: 1, keywordsVolume: 1200, keywordsBid: "1.50" }]));
              return;
            }
            if (url.startsWith("/api/advertisers")) {
              res.end(JSON.stringify([{ id: 1, name: "Advertiser A", status: "active" }, { id: 2, name: "Advertiser B", status: "active" }]));
              return;
            }
            if (url.startsWith("/api/init")) {
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (url.startsWith("/api/login")) {
              res.statusCode = 302;
              res.setHeader("Location", "/");
              res.end();
              return;
            }
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ message: "Mock handler error" }));
            return;
          }
          next();
        });
      },
    },
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../server/shared"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.resolve(__dirname, "tailwind.config.js") }),
        autoprefixer(),
      ],
    },
  },
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.BACKEND_PORT || 5000}` ,
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
