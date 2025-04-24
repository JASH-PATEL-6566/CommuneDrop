import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env": {},
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["all"],
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
});
