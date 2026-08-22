import { argbFromHex } from '@material/material-color-utilities';
import { Color } from './color.base';

/** Une couleur définie par un hexadécimal, modifiable après coup. */
export class ColorFromHex extends Color {
  constructor(
    public readonly name: string,
    private _hex: string,
  ) {
    super();
  }

  get argb(): number {
    return argbFromHex(this._hex);
  }

  /** Retourne l'hexadécimal tel qu'il a été fourni, sans normalisation. */
  override get hex(): string {
    return this._hex;
  }

  setHex(hex: string) {
    this._hex = hex;
  }
}
