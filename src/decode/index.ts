/**
 * @since 2019-10-30 03:00
 * @author vivaxy
 */
import crc32 from '../helpers/crc32';
import PNG_SIGNATURE from '../helpers/signature';
import { COLOR_TYPES } from '../helpers/color-types';
import { concatUint8Array } from '../helpers/typed-array';
import decodeIDAT from './decode-idat';

export default function decode(arrayBuffer: ArrayBuffer) {
  const typedArray = new Uint8Array(arrayBuffer);
  let idatUint8Array = new Uint8Array();

  const metadata: {
    width: number;
    height: number;
    depth: number;
    colorType: COLOR_TYPES;
    compression: number;
    interlace: number;
    filter: number;
    palette: [number, number, number, number][];
    data: number[];
  } = {
    width: 0,
    height: 0,
    depth: 0,
    colorType: 0,
    compression: 0,
    interlace: 0,
    filter: 0,
    palette: [],
    data: [],
  };

  // Helpers
  let index = 0;
  function readUInt32BE() {
    return (
      (typedArray[index++] << 24) |
      (typedArray[index++] << 16) |
      (typedArray[index++] << 8) |
      typedArray[index++]
    );
  }

  function readUInt8() {
    return typedArray[index++];
  }

  function readChunkType() {
    let name = '';
    for (const end = index + 4; index < end; index++) {
      name += String.fromCharCode(typedArray[index]);
    }
    return name;
  }

  // 1. Signature
  for (; index < PNG_SIGNATURE.length; index++) {
    if (typedArray[index] !== PNG_SIGNATURE[index]) {
      throw new Error(
        `Invalid file signature, at position ${index}: ${typedArray[index]} !== ${PNG_SIGNATURE[index]}`,
      );
    }
  }

  // 2. Chunks
  const chunkHandlers: {
    [key: string]: (startIndex: number, length: number) => void;
  } = {
    IHDR: parseIHDR,
    PLTE: parsePLTE,
    IDAT: parseIDAT,
    IEND: parseIEND,
    tRNS: parseTRNS,
  };

  function parseIHDR(startIndex: number, length: number) {
    metadata.width = readUInt32BE();
    metadata.height = readUInt32BE();
    metadata.depth = readUInt8();
    const colorType = readUInt8(); // bits: 1 palette, 2 color, 4 alpha
    if (!(colorType in COLOR_TYPES)) {
      throw new Error('Unsupported color type: ' + colorType);
    }
    metadata.colorType = colorType;
    metadata.compression = readUInt8();
    metadata.filter = readUInt8();
    metadata.interlace = readUInt8();

    parseChunkEnd(startIndex, length);
  }

  function parsePLTE(startIndex: number, length: number) {
    for (let i = 0; i < length; i += 3) {
      metadata.palette.push([
        typedArray[index++],
        typedArray[index++],
        typedArray[index++],
        0xff, // default to intransparent
      ]);
    }

    parseChunkEnd(startIndex, length);
  }

  function parseIDAT(startIndex: number, length: number) {
    // TODO: remove debugger
    if (idatUint8Array.length) {
      debugger;
    }
    // save data, decode later
    idatUint8Array = concatUint8Array(
      idatUint8Array,
      typedArray.slice(index, index + length),
    );
    index += length;
    parseChunkEnd(startIndex, length);
  }

  function parseIEND(startIndex: number, length: number) {
    index += length;
    parseChunkEnd(startIndex, length);
  }

  function parseTRNS(startIndex: number, length: number) {
    for (let i = 0; i < length; i++) {
      metadata.palette[i][3] = typedArray[index];
      index++;
    }

    parseChunkEnd(startIndex, length);
  }

  function parseChunkBegin() {
    const startIndex = index;
    const length = readUInt32BE();
    const type = readChunkType();

    if (chunkHandlers[type]) {
      return chunkHandlers[type](startIndex, length);
    }

    const ancillary = Boolean(type.charCodeAt(0) & 0x20); // or critical
    if (!ancillary) {
      throw new Error('Unsupported critical chunk type: ' + type);
    }
    // Skip chunk
    index += length;
    parseChunkEnd(startIndex, length);
  }

  function parseChunkEnd(startIndex: number, length: number) {
    const fileCrc32 = readUInt32BE();
    const calculatedCrc32 = crc32(
      typedArray.slice(startIndex + 4, startIndex + 8 + length),
    );
    if (fileCrc32 !== calculatedCrc32) {
      throw new Error(
        'Crc32 error: calculated ' +
          calculatedCrc32 +
          ', expected ' +
          fileCrc32,
      );
    }
    if (index < typedArray.length) {
      parseChunkBegin();
    }
  }

  parseChunkBegin();

  // 3. Decode all IDAT
  metadata.data = decodeIDAT(
    idatUint8Array,
    metadata.interlace,
    metadata.colorType,
    metadata.width,
    metadata.height,
    metadata.depth,
    metadata.palette,
  );
  return metadata;
}
