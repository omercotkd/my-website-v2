import { defineConfig } from 'astro/config';

// Static output, served by GitHub Pages from the repository path.
// If the site moves to its own domain, set `site` to it and drop `base`.
export default defineConfig({
  site: 'https://omercotkd.github.io',
  base: '/my-website-v2/',
});
