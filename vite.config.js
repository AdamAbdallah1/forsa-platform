import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'
import vercelFunctions from "./vite-plugin-vercel-functions.js";

export default defineConfig({
  plugins: [react(), tailwindcss(), vercelFunctions()],
  assetsInclude: ["**/*.lottie"],
});