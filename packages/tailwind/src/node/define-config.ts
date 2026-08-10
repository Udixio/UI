import { createDefineConfig } from '../config/define-config';
import { TailwindPlugin } from './tailwind.plugin';

export * from '../config/define-config';

export const defineConfig = createDefineConfig(TailwindPlugin);
