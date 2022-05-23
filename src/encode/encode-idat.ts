/**
 * @since 2019-12-30 01:47
 * @author Leo Nicolle
 */
import * as pako from 'pako';
import { buildImages, getPixelIndex } from '../helpers/interlace';
import {  FILTER_TYPES } from '../helpers/filters';

export default function encodeIDAT(
  data: number[],
  width: number,
  height: number,
  interlace: number,
) {
  const images = buildImages(interlace, width, height);
  const total = images.reduce((total, image ) => {
      return total + (image.passWidth + 1) * image.passHeight * 4
    }, 0) 
  let offset = 0;
  const typedArray = new Uint8Array(total);
  for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
    const { passWidth, passHeight, passIndex } = images[imageIndex];
    for (let heightIndex = 0; heightIndex < passHeight; heightIndex++) {
        typedArray[offset++] = FILTER_TYPES.NONE;
      // each line
      for (let widthIndex = 0; widthIndex < passWidth; widthIndex++) {
        const pixelIndex = getPixelIndex(
          interlace,
          width,
          passIndex,
          widthIndex,
          heightIndex,
          );
          typedArray[offset++] = data[pixelIndex];
          typedArray[offset++] = data[pixelIndex+1];
          typedArray[offset++] = data[pixelIndex+2];
          typedArray[offset++] = data[pixelIndex+3];
      }
    }
  }
  return pako.deflate(typedArray);
}
