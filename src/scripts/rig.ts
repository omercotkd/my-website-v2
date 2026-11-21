// The stickman rig.
//
// A pose is authored as joint positions in a small local space (about 200
// wide, ground at y = 220), then stored as bone angles and lengths. Blending
// two poses blends angles, so limbs swing instead of shrinking, and blends
// lengths, so a foreshortened limb (seen from behind, say) is still allowed.

export type Pt = readonly [number, number];

export interface PosePoints {
  hip: Pt;
  neck: Pt;
  elbowL: Pt;
  handL: Pt;
  elbowR: Pt;
  handR: Pt;
  kneeL: Pt;
  footL: Pt;
  kneeR: Pt;
  footR: Pt;
  /** Tip of the foot. Leave out for poses seen from the front or back. */
  toeL?: Pt;
  toeR?: Pt;
}

const BONES = [
  'spine',
  'armL1',
  'armL2',
  'armR1',
  'armR2',
  'legL1',
  'legL2',
  'toeL',
  'legR1',
  'legR2',
  'toeR',
] as const;
export type BoneName = (typeof BONES)[number];

interface Bone {
  /** Angle in radians. */
  a: number;
  /** Length in local units. */
  l: number;
}

export interface Pose {
  hip: Pt;
  bones: Record<BoneName, Bone>;
}

export const HEAD_R = 16;
/** Where the shoulders sit on the spine, measured from the neck. */
const SHOULDER = 0.225;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

function boneBetween(from: Pt, to: Pt): Bone {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  return { a: Math.atan2(dy, dx), l: Math.hypot(dx, dy) };
}

function endOf(from: Pt, b: Bone): Pt {
  return [from[0] + Math.cos(b.a) * b.l, from[1] + Math.sin(b.a) * b.l];
}

export function pose(p: PosePoints): Pose {
  const shoulder = lerpPt(p.neck, p.hip, SHOULDER);
  const none: Bone = { a: 0, l: 0 };
  return {
    hip: p.hip,
    bones: {
      spine: boneBetween(p.hip, p.neck),
      armL1: boneBetween(shoulder, p.elbowL),
      armL2: boneBetween(p.elbowL, p.handL),
      armR1: boneBetween(shoulder, p.elbowR),
      armR2: boneBetween(p.elbowR, p.handR),
      legL1: boneBetween(p.hip, p.kneeL),
      legL2: boneBetween(p.kneeL, p.footL),
      toeL: p.toeL ? boneBetween(p.footL, p.toeL) : none,
      legR1: boneBetween(p.hip, p.kneeR),
      legR2: boneBetween(p.kneeR, p.footR),
      toeR: p.toeR ? boneBetween(p.footR, p.toeR) : none,
    },
  };
}

/** Blend along the shorter way round the circle. */
function mixAngle(a: number, b: number, t: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function mix(a: Pose, b: Pose, t: number): Pose {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const bones = {} as Record<BoneName, Bone>;
  for (const name of BONES) {
    const ba = a.bones[name];
    const bb = b.bones[name];
    // A zero-length bone has no meaningful angle, so borrow the other one's.
    const aa = ba.l === 0 ? bb.a : ba.a;
    const ab = bb.l === 0 ? ba.a : bb.a;
    bones[name] = { a: mixAngle(aa, ab, t), l: lerp(ba.l, bb.l, t) };
  }
  return { hip: lerpPt(a.hip, b.hip, t), bones };
}

/** Copy of a pose with one bone turned by `delta` radians. */
export function turn(p: Pose, name: BoneName, delta: number): Pose {
  const b = p.bones[name];
  return { hip: p.hip, bones: { ...p.bones, [name]: { a: b.a + delta, l: b.l } } };
}

export interface Solved {
  hip: Pt;
  neck: Pt;
  head: Pt;
  shoulder: Pt;
  elbowL: Pt;
  handL: Pt;
  elbowR: Pt;
  handR: Pt;
  kneeL: Pt;
  footL: Pt;
  toeL: Pt;
  kneeR: Pt;
  footR: Pt;
  toeR: Pt;
}

export function solve(p: Pose): Solved {
  const b = p.bones;
  const neck = endOf(p.hip, b.spine);
  const head: Pt = [neck[0] + Math.cos(b.spine.a) * HEAD_R, neck[1] + Math.sin(b.spine.a) * HEAD_R];
  const shoulder = lerpPt(neck, p.hip, SHOULDER);
  const elbowL = endOf(shoulder, b.armL1);
  const elbowR = endOf(shoulder, b.armR1);
  const kneeL = endOf(p.hip, b.legL1);
  const kneeR = endOf(p.hip, b.legR1);
  const footL = endOf(kneeL, b.legL2);
  const footR = endOf(kneeR, b.legR2);
  return {
    hip: p.hip,
    neck,
    head,
    shoulder,
    elbowL,
    handL: endOf(elbowL, b.armL2),
    elbowR,
    handR: endOf(elbowR, b.armR2),
    kneeL,
    footL,
    toeL: endOf(footL, b.toeL),
    kneeR,
    footR,
    toeR: endOf(footR, b.toeR),
  };
}

const NS = 'http://www.w3.org/2000/svg';
const f = (n: number) => n.toFixed(1);
const line = (...pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join(' ');

/** Draws a pose into an SVG group. Styling comes from the `fig-*` classes. */
export class Figure {
  private paths: Record<'spine' | 'armL' | 'armR' | 'legL' | 'legR', SVGPathElement>;
  private head: SVGCircleElement;
  private joints: SVGCircleElement[];

  constructor(group: SVGGElement) {
    const make = <K extends 'path' | 'circle'>(tag: K, cls: string) => {
      const el = document.createElementNS(NS, tag) as SVGElementTagNameMap[K];
      el.setAttribute('class', cls);
      group.appendChild(el);
      return el;
    };
    this.paths = {
      legL: make('path', 'fig-line'),
      legR: make('path', 'fig-line'),
      spine: make('path', 'fig-line'),
      armL: make('path', 'fig-line'),
      armR: make('path', 'fig-line'),
    };
    this.head = make('circle', 'fig-line fig-head');
    this.head.setAttribute('r', String(HEAD_R));
    this.joints = Array.from({ length: 8 }, () => {
      const c = make('circle', 'fig-joint');
      c.setAttribute('r', '3.5');
      return c;
    });
  }

  /** Draws the pose and returns where every joint ended up. */
  draw(p: Pose): Solved {
    const s = solve(p);
    this.paths.spine.setAttribute('d', line(s.hip, s.neck));
    this.paths.armL.setAttribute('d', line(s.shoulder, s.elbowL, s.handL));
    this.paths.armR.setAttribute('d', line(s.shoulder, s.elbowR, s.handR));
    this.paths.legL.setAttribute('d', line(s.hip, s.kneeL, s.footL, s.toeL));
    this.paths.legR.setAttribute('d', line(s.hip, s.kneeR, s.footR, s.toeR));
    this.head.setAttribute('cx', f(s.head[0]));
    this.head.setAttribute('cy', f(s.head[1]));
    const jointPts = [s.shoulder, s.elbowL, s.handL, s.elbowR, s.handR, s.hip, s.kneeL, s.kneeR];
    jointPts.forEach((pt, i) => {
      this.joints[i].setAttribute('cx', f(pt[0]));
      this.joints[i].setAttribute('cy', f(pt[1]));
    });
    return s;
  }
}
