/**
 * The code of the "Change pages" tile on the root page: excerpts of the `motion-pages` examples. Every line is copied from
 * an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `// …
const update = () => render('scroll');
// …
navigate(update, { direction: 'forward' });`;

export const react = `export function useTransitionNavigate() {
  const router = useNavigate();
// …
  navigate(() => router(to), { direction });`;

export const angular = `@Injectable({ providedIn: 'root' })
export class TransitionRouter {
  private readonly router = inject(Router);
// …
return navigate(async () => {
  await this.router.navigate(commands);
}, { direction });`;

export const svelte = `import { goto } from '$app/navigation';
// …
return navigate(
  () => goto(href),
  { direction },
);`;
