import { atom } from 'nanostores';
import config from '../../theme.config';
import { API, type ConfigInterface } from '@udixio/theme';

export const themeConfigStore = atom<ConfigInterface>(config);

export const themeServiceStore = atom<API | null>(null);
