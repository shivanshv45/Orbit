import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


//config for vite
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));