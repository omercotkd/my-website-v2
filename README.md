# my-website-v2

My personal website: one long page where a stickman walks through my day as you scroll. Everything on it is drawn in code (SVG), with no images.

Built with [Astro](https://astro.build) and [GSAP](https://gsap.com) ScrollTrigger.

## Run it

```sh
npm install
npm run dev
```

`npm run build` writes the static site to `dist/`.

## Edit the text

Every word on the page, including the experience entries, lives in [`src/data/content.json`](src/data/content.json).

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages at <https://omercotkd.github.io/my-website-v2/> (see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

The design decisions and code layout are written up in [`DESIGN.md`](DESIGN.md).
