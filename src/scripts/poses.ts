// Every pose the stickman can take, in local space:
// hip around x = 100, ground at y = 220, facing right when seen from the side.

import { mix, pose, type Pose, type PosePoints } from './rig';

/** Same pose with the left and right limbs exchanged. */
function swapped(p: PosePoints): PosePoints {
  return {
    hip: p.hip,
    neck: p.neck,
    elbowL: p.elbowR,
    handL: p.handR,
    elbowR: p.elbowL,
    handR: p.handL,
    kneeL: p.kneeR,
    footL: p.footR,
    toeL: p.toeR,
    kneeR: p.kneeL,
    footR: p.footL,
    toeR: p.toeL,
  };
}

// Facing the viewer, right hand raised.
export const wave = pose({
  hip: [100, 140],
  neck: [100, 60],
  elbowL: [84, 106],
  handL: [80, 136],
  elbowR: [128, 84],
  handR: [142, 52],
  kneeL: [90, 180],
  footL: [86, 220],
  kneeR: [110, 180],
  footR: [114, 220],
});

// Standing with both arms down. Reads the same from the front and the back.
export const stand = pose({
  hip: [100, 140],
  neck: [100, 60],
  elbowL: [84, 106],
  handL: [80, 136],
  elbowR: [116, 106],
  handR: [120, 136],
  kneeL: [90, 180],
  footL: [86, 220],
  kneeR: [110, 180],
  footR: [114, 220],
});

// Seen from behind, sitting on the stool with both hands on the desk.
// The forearms point up and slightly out: if the hands came back in toward
// the shoulders, each forearm would lie on top of its upper arm and the arm
// would read as one straight line.
export const seatedBack = pose({
  hip: [100, 164],
  neck: [100, 78],
  elbowL: [74, 130],
  handL: [69, 105],
  elbowR: [126, 130],
  handR: [131, 105],
  kneeL: [74, 178],
  footL: [68, 218],
  kneeR: [126, 178],
  footR: [132, 218],
});

// ---- Gym: side view, head toward the left ------------------------------

const benchLegs = {
  kneeL: [134, 148],
  footL: [140, 220],
  toeL: [154, 220],
  kneeR: [138, 146],
  footR: [146, 220],
  toeR: [160, 220],
} as const;

// Sitting upright on the bench, hands on the thighs.
export const sitSide = pose({
  hip: [100, 160],
  neck: [102, 80],
  elbowL: [100, 126],
  handL: [120, 144],
  elbowR: [96, 128],
  handR: [114, 148],
  ...benchLegs,
});

// Lying on the bench, arms straight up, holding the bar.
export const benchUp = pose({
  hip: [100, 160],
  neck: [30, 158],
  elbowL: [42, 128],
  handL: [42, 98],
  elbowR: [45, 128],
  handR: [45, 98],
  ...benchLegs,
});

// Bar lowered to the chest, elbows dropped.
export const benchDown = pose({
  hip: [100, 160],
  neck: [30, 158],
  elbowL: [34, 168],
  handL: [42, 138],
  elbowR: [37, 168],
  handR: [45, 138],
  ...benchLegs,
});

// ---- Kitchen: side view, oven to the right -----------------------------

// Crouched forward with both hands inside the oven.
export const ovenReach = pose({
  hip: [118, 158],
  neck: [146, 94],
  elbowL: [168, 130],
  handL: [204, 152],
  elbowR: [164, 134],
  handR: [202, 156],
  kneeL: [134, 186],
  footL: [116, 220],
  toeL: [130, 220],
  kneeR: [112, 190],
  footR: [92, 216],
  toeR: [100, 220],
});

// Standing straight, holding the pie out in front.
export const holdPie = pose({
  hip: [100, 140],
  neck: [104, 61],
  elbowL: [118, 104],
  handL: [150, 100],
  elbowR: [112, 108],
  handR: [148, 106],
  kneeL: [108, 180],
  footL: [104, 220],
  toeL: [118, 220],
  kneeR: [92, 180],
  footR: [86, 220],
  toeR: [100, 220],
});

// Leaning in to set the pie down on top of the oven.
export const placePie = pose({
  hip: [114, 142],
  neck: [138, 70],
  elbowL: [172, 96],
  handL: [206, 92],
  elbowR: [168, 100],
  handR: [204, 96],
  kneeL: [124, 182],
  footL: [116, 220],
  toeL: [130, 220],
  kneeR: [104, 184],
  footR: [90, 218],
  toeR: [100, 220],
});

// ---- Contact: sitting on the ground, right hand raised ------------------

export const sitGround = pose({
  hip: [100, 204],
  neck: [107, 144],
  elbowL: [90, 186],
  handL: [82, 218],
  elbowR: [132, 150],
  handR: [144, 122],
  kneeL: [136, 178],
  footL: [156, 219],
  kneeR: [132, 208],
  footR: [162, 216],
});

// Walk cycle, side view. "Contact": both feet down, right leg forward.
const contactPts: PosePoints = {
  hip: [100, 140],
  neck: [105, 62],
  elbowL: [122, 102],
  handL: [136, 122],
  elbowR: [88, 104],
  handR: [80, 130],
  kneeR: [120, 176],
  footR: [126, 220],
  toeR: [140, 220],
  kneeL: [90, 180],
  footL: [70, 212],
  toeL: [78, 220],
};

// "Passing": right leg straight under the body, left leg swinging through.
const passingPts: PosePoints = {
  hip: [100, 137],
  neck: [104, 59],
  elbowL: [105, 104],
  handL: [110, 131],
  elbowR: [101, 104],
  handR: [100, 132],
  kneeR: [101, 178],
  footR: [100, 220],
  toeR: [114, 220],
  kneeL: [114, 174],
  footL: [100, 200],
  toeL: [110, 208],
};

const cycle: Pose[] = [
  pose(contactPts),
  pose(passingPts),
  pose(swapped(contactPts)),
  pose(swapped(passingPts)),
];

/**
 * How far the hip travels during one step, in local units. A planted front
 * foot starts 26 ahead of the hip and ends 30 behind it. Move the figure by
 * exactly this much per step and the feet do not slide.
 */
export const STRIDE = 56;

/** `steps` is the number of steps taken so far; fractions are mid-step. */
export function walkPose(steps: number): Pose {
  const x = (((steps * 2) % 4) + 4) % 4;
  const i = Math.floor(x);
  return mix(cycle[i], cycle[(i + 1) % 4], x - i);
}
