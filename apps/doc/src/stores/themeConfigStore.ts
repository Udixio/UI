import { atom } from 'nanostores';
import config from '../../theme.config';

export const themeConfigStore = atom(config);
