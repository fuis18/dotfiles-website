import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://fuis18.github.io",
  base: process.env.NODE_ENV === "production" ? "/dotfiles-website/" : "/",
  markdown: {
    shikiConfig: {
      theme: "catppuccin-mocha",
      wrap: true,
      langAlias: {
        conf: "ini",
      },
    },
  },
});
