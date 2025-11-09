// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
// import starlight from "@astrojs/starlight";

import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  site: "https://thedreambook.github.io",
  integrations: [
    expressiveCode({
      // themes: ["github-light", "github-dark"],
      // useDarkModeMediaQuery: true,
      frames: {
        showCopyToClipboardButton: true,
      },
    }),

    // starlight({
    //   title: "thedreambook+starlight",
    // }),

    mdx(),

    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // syntaxHighlight: "shiki",
    shikiConfig: {
      themes: {
        light: "github-dark",
        dark: "github-light",
      },
    },
  },
});
