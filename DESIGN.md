# Design brief: personal website v2

A short record of what the site is and what has been decided. Update it as decisions land.

## Concept

One long scrolling page. A stickman stays on a pinned stage for the whole visit, and scrolling moves him through a day: he arrives, works at his desk, closes the laptop, trains, bakes, and walks off into Japan. The content of the old site rides along with each scene.

Scrolling forward plays the story; scrolling back rewinds it.

## Decided

- **English only.** No i18n layer, no right-to-left handling.
- **Code-drawn art only.** The stickman and every prop are SVG. The only raster files are favicons.
- **Astro**, static output, deployed to GitHub Pages. Text is real HTML in the page; animation is plain TypeScript with GSAP ScrollTrigger. No React, no MUI.
- **The stickman is a rig.** About 11 joints; each pose is a set of joint angles; scroll position blends one pose into the next.
- **All text, experience included, comes from one JSON file** (`src/data/content.json`), read at build time.
- **The laptop screen is an interactive editor** (see Scene 3).

## Scenes

| # | Scene | Stickman | Content |
|---|---|---|---|
| 1 | Intro | Walks in, waves | Name, title, punchline, short bio |
| 2 | Origin | Walks past signposts | How I started (4 steps) |
| 3 | Desk | Sits facing the monitor, seen from behind; camera pushes into the screen | Editor: languages, tools, databases, experience, certificates |
| 4 | Gym | Closes laptop, bench presses | Gym |
| 5 | Kitchen | Stands up, takes an apple pie out of the oven | Baking and cooking |
| 6 | Japan | Walks through a torii gate toward Mount Fuji | Backpacking |
| 7 | End | Sits under the gate | Contact links |

## Scene 3: the editor

The camera is behind the stickman, not beside him. He waves, sits down facing a monitor, and the whole screen is visible above his head. The camera then pushes in until the screen fills the frame, styled as a code editor, with the top of his head still peeking in at the bottom edge.

- **Files as tabs:** `languages`, `tools`, `databases`, `experience.json`, `certificates`.
- **Scroll is the default driver.** Page scroll advances through the files and through the entries inside `experience.json`. There is no nested scrollbar, so the page never traps the wheel or a thumb.
- **Clicking a tab jumps** by scrolling the page to that file's position, so click and scroll never disagree.
- **Hover or tap an item** for detail (docs link, years used).
- **Stretch goal:** a small terminal that answers `help`, `ls`, `open experience.json`.
- No self-rated proficiency bars.

## Experience data

```json
{
  "kind": "job",
  "role": "Full-Stack Developer",
  "company": "Example Co",
  "start": "2024-02",
  "end": null,
  "summary": "One or two sentences.",
  "highlights": ["Optional bullet"],
  "stack": ["Python", "FastAPI"]
}
```

`kind` is `job` or `volunteer`. `end: null` means present. Entries are listed newest first.

## Constraints

- Works on a phone: stage on top, text below, same story.
- `prefers-reduced-motion`: one static pose per section, no scrubbing.
- A nav and a scene strip that jump to any scene, since the full scroll is long (about 18 screens).
- Text stays selectable and indexable; nothing important lives only inside the SVG.

## Open: visual direction

Four candidates are on the comparison canvas. Pick one, or mix a stickman from one with the page style of another.

| | Direction | Stickman | Page |
|---|---|---|---|
| A | Sketchbook | Thin, slightly wobbly pen line, open head | Grid paper, handwriting, one marker colour |
| B | Blueprint | Hairline with visible joints, annotated like a drawing | Navy grid, monospace, one bright accent |
| C | Pictogram | Thick rounded limbs, solid head, like a road sign | Flat colour per scene, heavy sans |
| D | Ink | Brush weight that tapers along each limb, solid head | White paper, serif, one red sun |

**Chosen: B, Blueprint.** The stickman is drawn as a technical figure with visible joints. Still open is which flavour of Blueprint:

| | Variation | Ground | Signature |
|---|---|---|---|
| B1 | Cyanotype | Classic blue sheet, white line, no accent colour | Labelled callouts, title block, hand-lettered caps |
| B2 | Whiteprint | Light graph paper, blue ink | Red-pencil notes that double as hints |
| B3 | CAD viewport | Dark neutral app window | Scene list as nav, selection grips on joints, command line |
| B4 | Patent drawing | White paper, black ink, serif | Numbered callouts, FIG. captions, hatched ground |

**Chosen flavour: B2, Whiteprint.**

| Token | Value |
|---|---|
| Paper | `#F6F8FB`, with a 16px minor grid (`#E3EAF5`) and an 80px major grid (`#C5D5EE`) |
| Ink (lines, stickman, borders) | `#1E3FA8` |
| Text | `#14275E`; secondary `#33457A`; muted `#4A5A85` |
| Set dressing (furniture, background) | `#7C93CC` |
| Red pencil (notes, torii, sun) | `#D4311F` |
| Headings | Space Grotesk 700 |
| Body, labels, code | IBM Plex Mono |
| Red-pencil notes | Caveat 600 |

Rules of the style:

- The stickman is blue ink, about 2.5px, with a white-filled head and small white joints.
- Red pencil is the only accent. It is used for handwritten notes that explain how the page behaves, and for the torii gate and the sun.
- Every screen has the same frame: sheet number and nav on top, a ruler line as the ground, and a seven-step scene strip underneath that shows where you are.

## Still to write

- One line each for Gym, Baking & Cooking and Backpacking. The bracketed placeholders are in `src/data/content.json`.
- Whether Gaming, listed as a hobby on the old site, gets a scene.

## Build order

1. ~~Pick the visual direction.~~ Done: Whiteprint.
2. ~~Prototype the rig and one transition scrubbed by scroll.~~ Done.
3. ~~Build the editor and wire `experience.json`.~~ Done.
4. ~~Scenes 04 to 07: gym, kitchen, Japan, contact.~~ Done. All seven scenes run end to end.
5. Write the three placeholder lines. (Experience entries are up to date as of November 2026.)
6. Tune poses and timing scene by scene.
7. Polish: reduced motion, short and very wide screens, no-JavaScript fallback, deploy to GitHub Pages.

## How the second half plays

- **Leaving the desk:** the camera pulls back out of the screen, he stands up and the monitor dims, then he turns and walks on.
- **Gym:** he sits on the bench, lies back, takes the bar off the rack and does three reps that follow the scroll, then racks it and sits up.
- **Kitchen:** he crouches into the open oven, stands up with the pie, holds it, then sets it on top of the oven.
- **Japan:** Mount Fuji and the sun drift in slowly behind him as he walks, and line up with the torii gate as he reaches it.
- **Contact:** he sits down under the gate and waves; the sun sets behind the mountain.

The page is about 18 screens of scroll. One constant, `SCREEN_PER_UNIT` in `src/scripts/main.ts`, makes the whole thing shorter or longer.

## How the code is laid out

| File | What it holds |
|---|---|
| `src/pages/index.astro` | The page: the SVG stage, scene text, the editor, the scene strip |
| `src/data/content.json` | Every word on the page, in page order, including the experience entries |
| `src/scripts/rig.ts` | The stickman: poses as bone angles, blending, drawing |
| `src/scripts/poses.ts` | Every pose, and the walk cycle |
| `src/scripts/main.ts` | The timeline: scroll position to pose, camera, text and editor |
| `src/styles/global.css` | The Whiteprint style |

Run it with `npm run dev`.

## Rewriting the text

Edit `src/data/content.json`; the page updates as you save. It is ordered the way the page reads: nav, intro, origin, desk, gym, kitchen, Japan, contact.

- `{count}` in a file's `note` becomes the number of items in that file.
- `{name}` in `contact.rights` becomes your name in capitals. Your name and role are written once, under `intro`, and reused in the nav, the page title and the footer.
- The red-pencil notes (`note`, `hint`) are lists of short lines. They sit in a fixed spot in the drawing, so keep each line about as long as it is now.
- There are four signposts, so `origin.steps` shows its first four entries.
- Jobs are the list under `desk.experience.items`. Add, remove or reorder entries there; `end: null` means present.
