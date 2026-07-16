import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" permite hospedar em qualquer subcaminho (GitHub Pages, etc.)
export default defineConfig({
  plugins: [react()],
  base: "./",
});
