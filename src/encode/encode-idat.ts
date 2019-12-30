/**
 * @since 2019-12-30 01:47
 * @author vivaxy
 */
import { concatUInt8Array } from '../helpers/typed-array';
import {
  COLOR_TYPES,
  COLOR_TYPES_TO_CHANNEL_PER_PIXEL,
} from '../helpers/color-types';
import { channelToTypedArray } from '../helpers/channels';
import { filters, FILTER_TYPES } from '../helpers/filters';

export default function encodeIDAT(
  data: number[],
  width: number,
  colorType: COLOR_TYPES,
  depth: number,
  interlace: number,
  palette?: [number, number, number, number][],
) {
  let typedArray = new Uint8Array();
  const scanlineCount = (data.length / width) >> 2;
  const channelPerPixel = COLOR_TYPES_TO_CHANNEL_PER_PIXEL[colorType];
  const scanlineWidth = (width * channelPerPixel * depth + 7) >> 3;

  for (let scanlineIndex = 0; scanlineIndex < scanlineCount; scanlineIndex++) {
    // each line
    const channels: number[] = [];
    const scanlineStartIndex = (scanlineIndex * width) << 2;
    for (let pixelIndex = 0; pixelIndex < width; pixelIndex++) {
      // each pixel
      const pixelStartIndex = scanlineStartIndex + (pixelIndex << 2);
      const pixel = data.slice(pixelStartIndex, pixelStartIndex + 4);

      // channels
      if (colorType === COLOR_TYPES.GRAYSCALE) {
      } else if (colorType === COLOR_TYPES.TRUE_COLOR) {
      } else if (colorType === COLOR_TYPES.PALETTE) {
        if (!palette) {
          throw new Error('Palette is required');
        }
        let paletteIndex = -1;
        for (let i = 0; i < palette.length; i++) {
          const paletteColor = palette[i];
          if (
            paletteColor[0] === pixel[0] &&
            paletteColor[1] === pixel[1] &&
            paletteColor[2] == pixel[2] &&
            paletteColor[3] === pixel[3]
          ) {
            paletteIndex = i;
          }
        }
        if (paletteIndex === -1) {
          throw new Error(
            'Invalid palette. Color (' +
              pixel.join(', ') +
              ') is not in palette',
          );
        }
        channels.push(paletteIndex);
      } else if (colorType === COLOR_TYPES.GRAYSCALE_WITH_ALPHA) {
      } else if (colorType === COLOR_TYPES.TRUE_COLOR_WITH_ALPHA) {
      }

      // set channels to unfilteredLine
    }
    const unfilteredLine = channelToTypedArray(channels, depth, scanlineWidth);
    // filter line
    let minFilterSum = Infinity;
    let filteredLine = new Uint8Array();
    let filterType = 0;
    const filterTypes = [
      FILTER_TYPES.NONE,
      FILTER_TYPES.SUB,
      FILTER_TYPES.UP,
      FILTER_TYPES.AVERAGE,
      FILTER_TYPES.PAETH,
    ];
    for (let filterIndex = 0; filterIndex < filterTypes.length; filterIndex++) {
      const filter = filters[filterTypes[filterIndex] as FILTER_TYPES];
      const { sum, filtered } = filter(unfilteredLine);
      if (sum < minFilterSum) {
        minFilterSum = sum;
        filteredLine = filtered;
        filterType = filterTypes[filterIndex];
      }
    }

    typedArray = concatUInt8Array(
      typedArray,
      concatUInt8Array(new Uint8Array([filterType]), filteredLine),
    );
  }
  return typedArray;
}
