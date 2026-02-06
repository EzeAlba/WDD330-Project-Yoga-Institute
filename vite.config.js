import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/",

  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/home/index.html"),
        classes: resolve(__dirname, "src/classes/index.html"),
        profile: resolve(__dirname, "src/profile/index.html"),
        dashboard: resolve(__dirname, "src/dashboard/index.html"),
      },
    },
  },
});
