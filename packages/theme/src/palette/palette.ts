import { Hct } from '../material-color-utilities/htc';
import { Context } from 'src/context';

export type PaletteCallback = (context: Context) => {
  hue: number;
  chroma: number;
};

export class Palette {
  private readonly cache = new Map<number, number>();
  private hueCache: number | null = null;
  private chromaCache: number | null = null;

  constructor(public callback: PaletteCallback) {}

  static fromVariant(color: Hct): Palette {
    const callback: PaletteCallback = (context) => {
      return context.variant.customPalettes(context, color);
    };
    return new Palette(callback);
  }

  update(args: Context) {
    this.clearCache();
    const result = this.callback(args);
    this.hueCache = result.hue;
    this.chromaCache = result.chroma;
  }

  private clearCache() {
    this.cache.clear();
    this.hueCache = null;
    this.chromaCache = null;
  }

  /**
   * @param tone HCT tone, measured from 0 to 100.
   * @return ARGB representation of a color with that tone.
   */
  tone(tone: number): number {
    const hue = this.hueCache;
    const chroma = this.chromaCache;

    if (hue == null || chroma == null)
      throw new Error('Palette must be updated before using tone');

    let argb = this.cache.get(tone);
    if (argb === undefined) {
      if (tone == 99 && Hct.isYellow(hue)) {
        argb = this.averageArgb(this.tone(98), this.tone(100));
      } else {
        argb = Hct.from(hue, chroma, tone).toInt();
      }
      this.cache.set(tone, argb);
    }
    return argb;
  }

  /**
   * @param tone HCT tone.
   * @return HCT representation of a color with that tone.
   */
  getHct(tone: number): Hct {
    return Hct.fromInt(this.tone(tone));
  }

  get hue(): number {
    const hue = this.hueCache;
    if (hue == null) {
      throw new Error('Palette must be updated before using hue');
    }
    return hue;
  }
  get chroma(): number {
    const chroma = this.chromaCache;
    if (chroma == null) {
      throw new Error('Palette must be updated before using hue');
    }
    return chroma;
  }

  private averageArgb(argb1: number, argb2: number): number {
    const red1 = (argb1 >>> 16) & 0xff;
    const green1 = (argb1 >>> 8) & 0xff;
    const blue1 = argb1 & 0xff;
    const red2 = (argb2 >>> 16) & 0xff;
    const green2 = (argb2 >>> 8) & 0xff;
    const blue2 = argb2 & 0xff;
    const red = Math.round((red1 + red2) / 2);
    const green = Math.round((green1 + green2) / 2);
    const blue = Math.round((blue1 + blue2) / 2);
    return (
      ((255 << 24) |
        ((red & 255) << 16) |
        ((green & 255) << 8) |
        (blue & 255)) >>>
      0
    );
  }
}

// /**
//  * Key color is a color that represents the hue and chroma of a tonal palette
//  */
// class KeyColor {
//   // Cache that maps tone to max chroma to avoid duplicated HCT calculation.
//   private readonly chromaCache = new Map<number, number>();
//   private readonly maxChromaValue = 200.0;
//
//   constructor(
//     readonly hue: number,
//     readonly requestedChroma: number,
//   ) {}
//
//   /**
//    * Creates a key color from a [hue] and a [chroma].
//    * The key color is the first tone, starting from T50, matching the given hue
//    * and chroma.
//    *
//    * @return Key color [Hct]
//    */
//   create(): Hct {
//     // Pivot around T50 because T50 has the most chroma available, on
//     // average. Thus it is most likely to have a direct answer.
//     const pivotTone = 50;
//     const toneStepSize = 1;
//     // Epsilon to accept values slightly higher than the requested chroma.
//     const epsilon = 0.01;
//
//     // Binary search to find the tone that can provide a chroma that is closest
//     // to the requested chroma.
//     let lowerTone = 0;
//     let upperTone = 100;
//     while (lowerTone < upperTone) {
//       const midTone = Math.floor((lowerTone + upperTone) / 2);
//       const isAscending =
//         this.maxChroma(midTone) < this.maxChroma(midTone + toneStepSize);
//       const sufficientChroma =
//         this.maxChroma(midTone) >= this.requestedChroma - epsilon;
//
//       if (sufficientChroma) {
//         // Either range [lowerTone, midTone] or [midTone, upperTone] has
//         // the answer, so search in the range that is closer the pivot tone.
//         if (Math.abs(lowerTone - pivotTone) < Math.abs(upperTone - pivotTone)) {
//           upperTone = midTone;
//         } else {
//           if (lowerTone === midTone) {
//             return Hct.from(this.hue, this.requestedChroma, lowerTone);
//           }
//           lowerTone = midTone;
//         }
//       } else {
//         // As there is no sufficient chroma in the midTone, follow the direction
//         // to the chroma peak.
//         if (isAscending) {
//           lowerTone = midTone + toneStepSize;
//         } else {
//           // Keep midTone for potential chroma peak.
//           upperTone = midTone;
//         }
//       }
//     }
//
//     return Hct.from(this.hue, this.requestedChroma, lowerTone);
//   }
//
//   // Find the maximum chroma for a given tone
//   private maxChroma(tone: number): number {
//     if (this.chromaCache.has(tone)) {
//       return this.chromaCache.get(tone)!;
//     }
//     const chroma = Hct.from(this.hue, this.maxChromaValue, tone).chroma;
//     this.chromaCache.set(tone, chroma);
//     return chroma;
//   }
// }
