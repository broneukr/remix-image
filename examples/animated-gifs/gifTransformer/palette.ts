// @ts-ignore find types for "get-rgba-palette" in js-image-lib if needed
import getPalette from "get-rgba-palette";
import type { Color } from "remix-image";

export const rgbToHex = (r: number, g: number, b: number): number =>
  (r << 16) + (g << 8) + b;

export const generatePalette = (buffer: Uint8Array, count: number): Color[] => {
  const powCount = Math.pow(2, Math.ceil(Math.log(count) / Math.log(2)));

  let colors: Color[] = getPalette(buffer, count).map((color: number[]) => [
    color[0],
    color[1],
    color[2],
    0xff,
  ]);

  if (colors.length === 0) {
    colors = getPalette(buffer, count, 10, () => true).map(
      (color: number[]) => [color[0], color[1], color[2], 0xff]
    );
  }

  if (colors.length < powCount) {
    const lastVal =
      colors.length > 0
        ? colors[colors.length - 1]
        : ([0x00, 0x00, 0x00, 0x00] as Color);
    const oldLen = colors.length;
    colors.length = powCount;
    colors.fill(lastVal, oldLen, powCount);
  }

  colors[colors.length - 1] = [0x00, 0x00, 0x00, 0x00];

  for (let i = 0; i < colors.length; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      const hex = colors[i][j];

      if (hex == null || Number.isNaN(hex)) {
        colors[i][j] = 0x0;
      } else if (hex < 0x0) {
        colors[i][j] = 0x0;
      } else if (hex > 0xff) {
        colors[i][j] = 0xff;
      }
    }
  }

  return colors;
};

export const mapImage = (image: Uint8Array, palette: Color[]): number[] => {
  const result = new Array<number>(image.length / 4);

  const colorToIndex = new Map<Color, number>();
  palette.forEach((color, index) => colorToIndex.set(color, index));

  for (let i = 0; i < image.length; i += 4) {
    const r = image[i];
    const g = image[i + 1];
    const b = image[i + 2];
    const a = image[i + 3];

    const color: Color = [r, g, b, a];

    if (colorToIndex.has(color)) {
      result[i / 4] = colorToIndex.get(color)!;
    } else {
      let maxDist = 1000;
      let index = 0;

      palette.forEach((cur, i) => {
        const dist = Math.sqrt(
          Math.pow(color[0] - cur[0], 2) +
            Math.pow(color[1] - cur[1], 2) +
            Math.pow(color[2] - cur[2], 2) +
            Math.pow(color[3] - cur[3], 2)
        );

        if (dist < maxDist) {
          maxDist = dist;
          index = i;
        }
      });

      colorToIndex.set(color, index);
      result[i / 4] = index;
    }
  }

  return result;
};
