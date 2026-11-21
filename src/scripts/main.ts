// Scroll drives everything. One number, `t`, runs from 0 to TOTAL as the page
// scrolls; each frame the pose, the camera, the props, the text and the
// editor are all worked out from `t` alone, so scrolling back simply rewinds.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Figure, mix, solve, turn, type Pose, type Pt } from './rig';
import {
  benchDown,
  benchUp,
  holdPie,
  ovenReach,
  placePie,
  seatedBack,
  sitGround,
  sitSide,
  stand,
  STRIDE,
  walkPose,
  wave,
} from './poses';

gsap.registerPlugin(ScrollTrigger);

function $<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}
const all = <T extends Element>(selector: string) => Array.from(document.querySelectorAll<T>(selector));

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0 before `a`, 1 after `b`, a smooth ramp between. */
const ramp = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const ease = gsap.parseEase('power2.inOut');

// ---- Elements ---------------------------------------------------------

const scroller = $<HTMLElement>('#scroller');
const stagebox = $<HTMLElement>('#stagebox');
const art = $<HTMLElement>('#art');
const svg = $<SVGSVGElement>('#stage');
const world = $<SVGGElement>('#world');
const far = $<SVGGElement>('#far');
const sun = $<SVGCircleElement>('#sun');
const figureGroup = $<SVGGElement>('#figure');
const postsGroup = $<SVGGElement>('#posts');
const plate = $<SVGGElement>('#plate');
const plateRacked = $<SVGGElement>('#plate-racked');
const pie = $<SVGGElement>('#pie');
const steam = $<SVGGElement>('#steam');
const introNote = $<SVGGElement>('#intro-note');
const gymNote = $<SVGGElement>('#gym-note');
const pieNote = $<SVGGElement>('#pie-note');
const ruler = $<HTMLElement>('#ruler');
const editor = $<HTMLElement>('#editor');
const editorPath = $<HTMLElement>('#editor-path');
const editorNote = $<HTMLElement>('#editor-note');
const sheetNo = $<HTMLElement>('#sheet-no');
const monitor = $<SVGRectElement>('#monitor');

const text = {
  intro: $<HTMLElement>('#text-intro'),
  origin: $<HTMLElement>('#text-origin'),
  gym: $<HTMLElement>('#text-gym'),
  kitchen: $<HTMLElement>('#text-kitchen'),
  japan: $<HTMLElement>('#text-japan'),
  contact: $<HTMLElement>('#text-contact'),
};

const posts = all<SVGGElement>('[data-post]');
const postXs = posts.map((p) => Number(p.dataset.post));
const stepEls = all<HTMLElement>('[data-step]');
const fileButtons = all<HTMLButtonElement>('[data-file]');
const panes = all<HTMLElement>('[data-pane]');
const entries = all<HTMLElement>('[data-entry]');
const sceneLinks = all<HTMLElement>('[data-scene]');
const navLinks = all<HTMLElement>('[data-nav]');

// ---- World ------------------------------------------------------------

const VIEW_H = 560;
const S = Number(scroller.dataset.figureScale);
const GROUND = Number(scroller.dataset.ground);
const START_X = Number(scroller.dataset.startX);
const DESK_X = Number(scroller.dataset.deskX);
const GYM_X = Number(scroller.dataset.gymX);
const KITCHEN_X = Number(scroller.dataset.kitchenX);
const TORII_X = Number(scroller.dataset.toriiX);

// The monitor's rectangle in world units, read from the drawing itself.
const deskOriginX = DESK_X - 296 * S;
const deskOriginY = GROUND - 430 * S;
const MON = {
  w: monitor.width.baseVal.value * S,
  h: monitor.height.baseVal.value * S,
  cx: deskOriginX + (monitor.x.baseVal.value + monitor.width.baseVal.value / 2) * S,
  cy: deskOriginY + (monitor.y.baseVal.value + monitor.height.baseVal.value / 2) * S,
};

// Where carried things sit, in the stickman's local space.
const offset = (p: Pt, dx: number, dy: number): Pt => [p[0] + dx, p[1] + dy];
const barAbove = (hand: Pt) => offset(hand, 0, -4);
const pieBeside = (hand: Pt) => offset(hand, 30, -8);
const BAR_RACKED = barAbove(solve(benchUp).handL);
const PIE_IN_OVEN = pieBeside(solve(ovenReach).handL);
const PIE_ON_TOP = pieBeside(solve(placePie).handL);

// ---- Timeline ---------------------------------------------------------

// The editor's steps: one per file, except experience, which gets one per entry.
const steps: { file: string; entry: number }[] = [];
for (const button of fileButtons) {
  const file = button.dataset.file!;
  if (file === 'experience' && entries.length > 0) {
    entries.forEach((_, entry) => steps.push({ file, entry }));
  } else {
    steps.push({ file, entry: -1 });
  }
}

/** World units walked per unit of `t`. Fixes how fast the legs turn over. */
const WALK_RATE = 850;
/** Screens of scroll per unit of `t`. Raise to slow the whole page down. */
const SCREEN_PER_UNIT = 0.75;
const STEP = 0.5;
const REPS = 3;

interface Seg {
  a: number;
  b: number;
}
let cursor = 0;
const seg = (length: number): Seg => {
  const s = { a: cursor, b: cursor + length };
  cursor += length;
  return s;
};
const walk = (from: number, to: number) => seg((to - from) / WALK_RATE);

// The whole page, in order. Each entry is how long that beat lasts.
const T = {
  intro: seg(1.0), // waving, text on screen
  turn1: seg(0.4), // turns to the side
  walk1: walk(START_X, DESK_X), // past the signposts
  arrive1: seg(0.4), // turns his back, facing the monitor
  sit1: seg(0.7),
  zoomIn: seg(1.0), // screen fills the stage
  editor: seg(steps.length * STEP),
  zoomOut: seg(0.7),
  rise: seg(0.45), // stands up, screen dims
  turn2: seg(0.25),
  walk2: walk(DESK_X, GYM_X),
  benchSit: seg(0.45),
  benchLie: seg(0.5), // lies back, takes the bar
  reps: seg(REPS * 0.5),
  benchRise: seg(0.5), // racks the bar, sits up
  turn3: seg(0.35),
  walk3: walk(GYM_X, KITCHEN_X),
  reach: seg(0.5), // crouches into the oven
  pull: seg(0.45), // stands up with the pie
  hold: seg(0.45),
  place: seg(0.45), // sets it on top of the oven
  turn4: seg(0.3),
  walk4: walk(KITCHEN_X, TORII_X),
  sitDown: seg(0.55), // sits under the gate
  contact: seg(1.0), // waving goodbye
};
const TOTAL = cursor;

/** How far through a beat we are, 0 to 1. */
const within = (s: Seg, t: number) => clamp01((t - s.a) / (s.b - s.a));
const mid = (s: Seg) => (s.a + s.b) / 2;
const stepStart = (i: number) => T.editor.a + i * STEP;

const GOTO: Record<string, number> = {
  intro: 0,
  origin: T.walk1.a + 0.3,
  desk: stepStart(0) + STEP / 2,
  gym: T.reps.a + 0.1,
  kitchen: mid(T.hold),
  japan: mid(T.walk4),
  contact: TOTAL - 0.2,
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const narrowScreen = window.matchMedia('(max-width: 760px)');

/** With reduced motion there is no scrubbing: one still per section. */
function settle(t: number): number {
  if (!reducedMotion.matches) return t;
  if (t < 1.2) return 0;
  if (t < T.walk1.b) {
    const i = Math.min(postXs.length - 1, Math.floor(((t - 1.2) / (T.walk1.b - 1.2)) * postXs.length));
    return lerp(T.walk1.a, T.walk1.b, (postXs[i] - 120 - START_X) / (DESK_X - START_X));
  }
  if (t < T.editor.a) return T.editor.a;
  if (t < T.editor.b) return t;
  if (t < mid(T.walk2)) return T.editor.b - 0.01;
  if (t < T.turn3.b) return T.reps.a;
  if (t < T.turn4.b) return mid(T.hold);
  if (t < T.sitDown.a) return lerp(T.walk4.a, T.walk4.b, 0.6);
  return TOTAL;
}

// ---- The stickman's script -----------------------------------------------

const figureX = (t: number) =>
  START_X +
  (DESK_X - START_X) * within(T.walk1, t) +
  (GYM_X - DESK_X) * within(T.walk2, t) +
  (KITCHEN_X - GYM_X) * within(T.walk3, t) +
  (TORII_X - KITCHEN_X) * within(T.walk4, t);

/** Mid-stride pose, `k` of the way from `from` to `to`. */
const stride = (from: number, to: number, k: number) => walkPose(((to - from) * k) / (STRIDE * S));

/** The raised forearm swings on its own; `strength` fades it in and out. */
function waving(base: Pose, strength: number, now: number): Pose {
  if (reducedMotion.matches || strength <= 0) return base;
  const swing = Math.sin(now * 0.006) * strength;
  return turn(turn(base, 'armR2', swing * 0.32), 'armR1', swing * 0.06);
}

type Act = (k: number, now: number) => Pose;
const blend =
  (from: Pose, to: Pose): Act =>
  (k) =>
    mix(from, to, ease(k));
const still =
  (p: Pose): Act =>
  () =>
    p;

const endOfWalk1 = stride(START_X, DESK_X, 1);
const endOfWalk2 = stride(DESK_X, GYM_X, 1);
const endOfWalk3 = stride(GYM_X, KITCHEN_X, 1);
const endOfWalk4 = stride(KITCHEN_X, TORII_X, 1);
const firstStep = walkPose(0);

// What he does during each beat, in the same order as `T`.
const script: [Seg, Act][] = [
  [T.intro, (k, now) => waving(wave, 1 - ramp(0.6, 1, k), now)],
  [T.turn1, blend(wave, firstStep)],
  [T.walk1, (k) => stride(START_X, DESK_X, k)],
  [T.arrive1, blend(endOfWalk1, stand)],
  [T.sit1, blend(stand, seatedBack)],
  [T.zoomIn, still(seatedBack)],
  [T.editor, still(seatedBack)],
  [T.zoomOut, still(seatedBack)],
  [T.rise, blend(seatedBack, stand)],
  [T.turn2, blend(stand, firstStep)],
  [T.walk2, (k) => stride(DESK_X, GYM_X, k)],
  [T.benchSit, blend(endOfWalk2, sitSide)],
  [T.benchLie, blend(sitSide, benchUp)],
  [T.reps, (k) => mix(benchUp, benchDown, (1 - Math.cos(k * REPS * Math.PI * 2)) / 2)],
  [T.benchRise, blend(benchUp, sitSide)],
  [T.turn3, blend(sitSide, firstStep)],
  [T.walk3, (k) => stride(GYM_X, KITCHEN_X, k)],
  [T.reach, blend(endOfWalk3, ovenReach)],
  [T.pull, blend(ovenReach, holdPie)],
  [T.hold, still(holdPie)],
  [T.place, blend(holdPie, placePie)],
  [T.turn4, blend(placePie, firstStep)],
  [T.walk4, (k) => stride(KITCHEN_X, TORII_X, k)],
  [T.sitDown, blend(endOfWalk4, sitGround)],
  [T.contact, (k, now) => waving(sitGround, ramp(0, 0.3, k), now)],
];

function poseAt(t: number, now: number): Pose {
  for (const [s, act] of script) {
    if (t < s.b) return act(within(s, t), now);
  }
  return waving(sitGround, 1, now);
}

/** Smoothly follows a list of [t, value] points. */
function follow(points: [number, number][], t: number): number {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [t1, v1] = points[i];
    if (t <= t1) {
      const [t0, v0] = points[i - 1];
      return lerp(v0, v1, ramp(t0, t1, t));
    }
  }
  return points[points.length - 1][1];
}

// Where the figure sits across the screen (0 = left edge, 1 = right edge),
// chosen per scene so the text has room beside him.
const ACROSS: [number, number][] = [
  [T.intro.b, 0.24],
  [T.turn1.b + 0.2, 0.38],
  [T.walk1.b - 0.5, 0.38],
  [T.arrive1.b, 0.5],
  [T.rise.b, 0.5],
  [T.walk2.a + 0.4, 0.38],
  [T.walk2.b - 0.4, 0.38],
  [T.benchSit.b, 0.6],
  [T.benchRise.b, 0.6],
  [T.walk3.a + 0.4, 0.38],
  [T.walk3.b - 0.4, 0.38],
  [T.reach.b, 0.52],
  [T.place.b, 0.52],
  [T.walk4.a + 0.4, 0.34],
  [T.walk4.b - 0.5, 0.34],
  [T.sitDown.b, 0.3],
];
const LAST_ACROSS = ACROSS[ACROSS.length - 1][1];
// On a wide screen the camera leans in a little for the two small scenes.
const SCENE_ZOOM: [number, number][] = [
  [T.walk2.b - 0.5, 1],
  [T.benchSit.b, 1.3],
  [T.benchRise.b, 1.3],
  [T.turn3.b + 0.3, 1],
  [T.walk3.b - 0.5, 1],
  [T.reach.b, 1.25],
  [T.place.b, 1.25],
  [T.turn4.b + 0.3, 1],
];
/** How much slower the far background moves than the ground. */
const FAR_DRIFT = 0.55;

// ---- Layout, re-measured on resize -------------------------------------

const layout = { viewW: 1280, scale: 1, zoom: 2, zoomedScreenY: 280, boxW: 0, boxH: 0 };

function measure(): void {
  const r = art.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return;
  // The stage is always 560 units tall; its width follows the screen's shape.
  layout.viewW = Math.min(2600, Math.max(400, (VIEW_H * r.width) / r.height));
  layout.scale = r.height / VIEW_H;
  svg.setAttribute('viewBox', `0 0 ${layout.viewW.toFixed(1)} ${VIEW_H}`);
  // Zoom until the monitor nearly fills the stage, leaving room below it
  // for the top of the stickman's head.
  layout.zoom = Math.max(1, Math.min((0.92 * layout.viewW) / MON.w, (0.8 * VIEW_H) / MON.h));
  layout.zoomedScreenY = 12 + (MON.h * layout.zoom) / 2;
  layout.boxW = stagebox.clientWidth;
  layout.boxH = stagebox.clientHeight;
  editor.style.setProperty('--ed-w', `${(MON.w * layout.zoom * layout.scale).toFixed(1)}px`);
  editor.style.setProperty('--ed-h', `${(MON.h * layout.zoom * layout.scale).toFixed(1)}px`);
  dirty = true;
}

// ---- Drawing one frame --------------------------------------------------

const figure = new Figure(figureGroup);
const state = { t: 0 };
let dirty = true;
let currentStep = -1;
let currentScene = -1;

function fade(el: HTMLElement | SVGElement, opacity: number): void {
  el.style.opacity = opacity.toFixed(3);
  el.style.visibility = opacity <= 0.001 ? 'hidden' : 'visible';
}

/** Visible from `a` to `b`, with a fade of `soft` at each end. */
const shown = (a: number, b: number, t: number, soft = 0.35) => ramp(a, a + soft, t) * (1 - ramp(b - soft, b, t));

const place = (el: SVGElement, p: Pt) => el.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);

function showStep(index: number): void {
  if (index === currentStep) return;
  currentStep = index;
  const step = steps[index];
  for (const button of fileButtons) {
    const on = button.dataset.file === step.file;
    button.setAttribute('aria-selected', String(on));
    if (on) {
      editorPath.textContent = button.dataset.label ?? '';
      editorNote.textContent = button.dataset.note ?? '';
      // On a phone the files are a scrolling row of tabs: keep this one in view.
      const row = button.parentElement;
      if (row && row.scrollWidth > row.clientWidth) row.scrollTo({ left: button.offsetLeft - 16 });
    }
  }
  for (const pane of panes) pane.hidden = pane.dataset.pane !== step.file;
  entries.forEach((entry, i) => entry.classList.toggle('is-open', i === step.entry));
  keepInView(entries[step.entry]);
}

// The entry list can be taller than the screen it sits in (a long list of jobs, or a
// phone). The pane has no scrollbar of its own, so move it to keep the open entry whole.
function keepInView(open: HTMLElement | undefined): void {
  const pane = (open ?? entries[0])?.closest<HTMLElement>('.editor-pane');
  if (!pane) return;
  if (!open) {
    pane.scrollTop = 0;
    return;
  }
  // The editor is scaled while the camera moves, so measure in its own units.
  const box = pane.getBoundingClientRect();
  const scale = box.height / pane.offsetHeight || 1;
  const rect = open.getBoundingClientRect();
  const top = (rect.top - box.top) / scale + pane.scrollTop;
  const bottom = top + rect.height / scale;
  const margin = parseFloat(getComputedStyle(pane).paddingTop);
  const lowest = Math.max(0, bottom + margin - pane.clientHeight);
  pane.scrollTop = Math.min(Math.max(0, top - margin), lowest);
}

const SECTION_OF_SCENE = ['about', 'about', 'work', 'after', 'after', 'after', 'contact'];

function showScene(index: number): void {
  if (index === currentScene) return;
  currentScene = index;
  sheetNo.textContent = String(index + 1).padStart(2, '0');
  for (const link of sceneLinks) {
    link.setAttribute('aria-current', String(Number(link.dataset.scene) === index));
  }
  for (const link of navLinks) {
    link.setAttribute('aria-current', String(link.dataset.nav === SECTION_OF_SCENE[index]));
  }
}

function sceneAt(t: number): number {
  if (t < 1.2) return 0;
  if (t < T.walk1.b) return 1;
  if (t < T.turn2.b) return 2;
  if (t < T.turn3.b) return 3;
  if (t < T.turn4.b) return 4;
  if (t < T.sitDown.a) return 5;
  return 6;
}

function render(now: number): void {
  const t = settle(state.t);
  const { viewW, scale, zoom } = layout;
  const narrow = narrowScreen.matches;

  // The figure.
  const figX = figureX(t);
  const joints = figure.draw(poseAt(t, now));
  figureGroup.setAttribute('transform', `translate(${(figX - 100 * S).toFixed(2)} ${GROUND - 220 * S}) scale(${S})`);

  // The camera, anchored to the ground so zooming never lifts the floor.
  // On a phone the stage is small, so it stays centred on him and close,
  // pulling back only at the desk to fit the monitor in.
  const across = narrow ? 0.5 : follow(ACROSS, t);
  const closeUp = narrow ? 1.45 : 1;
  const atDesk = ramp(T.walk1.b - 0.9, T.walk1.b, t) * (1 - ramp(T.turn2.a, T.walk2.a + 0.5, t));
  const base = narrow ? lerp(closeUp, 1, atDesk) : follow(SCENE_ZOOM, t);
  const zoomed = ease(within(T.zoomIn, t)) * (1 - ease(within(T.zoomOut, t)));
  const z = lerp(base, zoom, zoomed);
  const camX = figX - ((across - 0.5) * viewW) / z;
  const camY = lerp(GROUND, MON.cy, zoomed);
  const screenY = lerp(VIEW_H, layout.zoomedScreenY, zoomed);
  world.setAttribute(
    'transform',
    `translate(${(viewW / 2).toFixed(2)} ${screenY.toFixed(2)}) scale(${z.toFixed(4)}) translate(${(-camX).toFixed(2)} ${(-camY).toFixed(2)})`,
  );
  ruler.style.setProperty('--ruler-x', `${(-(camX * scale * z) % 16).toFixed(1)}px`);

  // Far background: Fuji and the sun drift slowly and line up with the gate
  // exactly when he arrives. The sun sets as he sits down.
  const camAtGate = TORII_X - (((narrow ? 0.5 : LAST_ACROSS) - 0.5) * viewW) / closeUp;
  far.setAttribute('transform', `translate(${((camX - camAtGate) * FAR_DRIFT).toFixed(2)} 0)`);
  fade(far, ramp(T.walk4.a + 0.1, T.walk4.a + 0.8, t));
  sun.setAttribute('cy', lerp(140, 400, ease(ramp(T.sitDown.a, T.contact.b - 0.2, t))).toFixed(1));

  // Things he carries follow his hand; otherwise they rest where they belong.
  const lifting = t >= T.reps.a && t < T.reps.b;
  // The bar is drawn over him while he lifts it and behind him on the rack.
  place(plate, lifting ? barAbove(joints.handL) : BAR_RACKED);
  plate.style.visibility = lifting ? 'visible' : 'hidden';
  plateRacked.style.visibility = lifting ? 'hidden' : 'visible';
  const carrying = t >= T.pull.a && t < T.place.b;
  place(pie, carrying ? pieBeside(joints.handL) : t < T.pull.a ? PIE_IN_OVEN : PIE_ON_TOP);
  fade(steam, ramp(mid(T.pull), T.pull.b, t));

  // Scene text and red-pencil notes.
  const introShown = 1 - ramp(0.55, 0.95, t);
  fade(text.intro, introShown);
  fade(introNote, introShown);
  // The signposts are drawn in as he sets off. The origin text steps aside
  // as soon as the monitor starts to slide in from the right.
  const monitorLeft = viewW / 2 + (MON.cx - MON.w / 2 - camX) * z;
  fade(text.origin, ramp(1.15, 1.5, t) * ramp(0.8 * viewW, 0.98 * viewW, monitorLeft));
  fade(postsGroup, ramp(0.75, 1.15, t) * (1 - ramp(T.zoomOut.a, T.zoomOut.b, t)));
  fade(text.gym, shown(T.walk2.b - 0.6, T.turn3.b + 0.2, t));
  fade(gymNote, shown(T.benchLie.b - 0.1, T.benchRise.a + 0.15, t, 0.25));
  fade(text.kitchen, shown(T.walk3.b - 0.6, T.turn4.b + 0.2, t));
  fade(pieNote, shown(T.pull.b - 0.1, T.place.a + 0.2, t, 0.25));
  fade(text.japan, shown(T.walk4.a + 0.4, T.walk4.b - 0.1, t));
  fade(text.contact, ramp(T.sitDown.a + 0.2, T.sitDown.b, t));

  // Signposts: the one he is passing lights up, with its step.
  const passed = postXs.filter((x) => x - 220 <= figX).length;
  const active = Math.max(0, passed - 1);
  posts.forEach((post, i) => {
    post.classList.toggle('is-active', i === active && passed > 0);
    post.classList.toggle('is-ahead', i >= passed);
  });
  stepEls.forEach((el, i) => el.classList.toggle('is-active', i === active));

  // The editor rides on the monitor: same centre, scaled with the camera.
  const edW = MON.w * zoom * scale;
  const edH = MON.h * zoom * scale;
  const ex = (viewW / 2 + (MON.cx - camX) * z) * scale;
  const ey = (screenY + (MON.cy - camY) * z) * scale;
  // On a phone the monitor is too small to read, so while zoomed in the
  // screen grows to fill the whole stage.
  const full = narrow && t >= T.zoomIn.b - 0.02 && t <= T.zoomOut.a + 0.02;
  editor.classList.toggle('is-full', full);
  if (full) {
    editor.style.width = `${layout.boxW - 16}px`;
    editor.style.height = `${layout.boxH - 16}px`;
    editor.style.transform = 'translate(8px, 8px) scale(1)';
  } else {
    editor.style.width = '';
    editor.style.height = '';
    editor.style.transform = `translate(${(ex - edW / 2).toFixed(1)}px, ${(ey - edH / 2).toFixed(1)}px) scale(${(z / zoom).toFixed(4)})`;
  }
  editor.style.visibility = ex > -edW && ex < layout.boxW + edW ? 'visible' : 'hidden';
  editor.classList.toggle('is-off', t >= T.rise.a + 0.1);

  const stepIndex = Math.floor((t - T.editor.a) / STEP);
  showStep(Math.min(steps.length - 1, Math.max(0, stepIndex)));
  showScene(sceneAt(t));
}

// ---- Wiring -------------------------------------------------------------

function scrollToT(t: number): void {
  const max = scroller.offsetHeight - window.innerHeight;
  window.scrollTo({
    top: scroller.offsetTop + (t / TOTAL) * max,
    behavior: reducedMotion.matches ? 'auto' : 'smooth',
  });
}

for (const link of all<HTMLElement>('[data-goto]')) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToT(GOTO[link.dataset.goto ?? 'intro'] ?? 0);
  });
}

// Clicking a file or an entry scrolls to it, so clicks and scrolling agree.
for (const button of fileButtons) {
  button.addEventListener('click', () => {
    const i = steps.findIndex((s) => s.file === button.dataset.file);
    if (i >= 0) scrollToT(stepStart(i) + STEP / 2);
  });
}
entries.forEach((entry, index) => {
  entry.querySelector('.entry-head')?.addEventListener('click', () => {
    const i = steps.findIndex((s) => s.file === 'experience' && s.entry === index);
    if (i >= 0) scrollToT(stepStart(i) + STEP / 2);
  });
});

scroller.dataset.total = TOTAL.toFixed(3);
scroller.style.height = `calc(100svh + ${(TOTAL * SCREEN_PER_UNIT * 100).toFixed(0)}svh)`;
measure();
new ResizeObserver(measure).observe(art);
narrowScreen.addEventListener('change', measure);
reducedMotion.addEventListener('change', () => {
  dirty = true;
});

gsap.to(state, {
  t: TOTAL,
  ease: 'none',
  scrollTrigger: {
    trigger: scroller,
    start: 'top top',
    end: 'bottom bottom',
    scrub: reducedMotion.matches ? true : 0.5,
  },
  onUpdate: () => {
    dirty = true;
  },
});

gsap.ticker.add(() => {
  // The idle waves need a redraw every frame; everything else only on change.
  const waving = !reducedMotion.matches && (state.t < T.intro.b || state.t > T.contact.a);
  if (!dirty && !waving) return;
  dirty = false;
  render(performance.now());
});
