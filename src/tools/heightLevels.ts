import type { HeightLevels } from '../core/types';

export const DEFAULT_HEIGHT_LEVELS: HeightLevels = {
  blackInput: 0,
  whiteInput: 255,
  gamma: 1,
  blackOutput: 0,
  whiteOutput: 255,
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Apply Photoshop-style input/output Levels to one normalized luminance sample. */
export function applyHeightLevels(value: number, levels?: HeightLevels): number {
  const current = levels || DEFAULT_HEIGHT_LEVELS;
  const black = clamp(current.blackInput, 0, 254);
  const white = Math.max(black + 1, clamp(current.whiteInput, 1, 255));
  const gamma = Math.max(0.05, current.gamma || 1);
  const normalized = clamp((clamp(value, 0, 1) * 255 - black) / (white - black), 0, 1);
  const adjusted = Math.pow(normalized, 1 / gamma);
  const outputBlack = clamp(current.blackOutput, 0, 255);
  const outputWhite = clamp(current.whiteOutput, 0, 255);
  return clamp((outputBlack + (outputWhite - outputBlack) * adjusted) / 255, 0, 1);
}
