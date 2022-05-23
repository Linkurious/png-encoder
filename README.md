# @linkurious/png-encoder

Forked from [vivaxy/png](https://github.com/vivaxy/png), removed the decoder and made the encoder faster (by also deleting support for different image filters, color depths, interlace and palette).

[![NPM Version][npm-version-image]][npm-url]

# Supports
- Chunks: IHDR, PLTE, IDAT, IEND, tRNS, cHRM, gAMA, iCCP, sBIT, sRGB, tEXt, zTXt, iTXt, bKGD, hIST, pHYs, sPLT, tIME
- Color Types:  Truecolour with alpha
- Bit Depths:  8
- Filters: None

# Install

 `npm i @linkurious/png-encode`

# Usage

```js
import encoder from '@linkurious/png';

function arrayToImage(array: Uint8Array): HTMLImageElement {
  const blob = new Blob([array], { type: 'image/png' });
  var objectURL = URL.createObjectURL(blob);
  const img = document.createElement('img');
  img.src = objectURL;
  return img;
}

const imageBuffer = pngEncoder.encode({
  width,
  height,
  depth: 8,
  colorType: 6,
  compression: 0,
  interlace: 0,
  filter: 0,
  data: arrayOfPixelsRGBA
});

 document.body.appendChild(arrayToImage(imageBuffer));

```

See `metadata` type definition in [metadata.ts](src/helpers/metadata.ts).
