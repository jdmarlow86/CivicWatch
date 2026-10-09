import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset URLs work reliably when hosted from a GitHub Pages project path.
  base: "./",
  plugins: [react()],
});
