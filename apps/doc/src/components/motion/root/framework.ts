/**
 * The framework of the root page, chosen once for the site and stored with the other examples' preference. It reaches the
 * install command and the live results of the page (`[data-framework-variant]`), which follow the store through
 * lib/framework-choice.ts. The principle's tabs and its copy button follow the store themselves (PrincipleToolbar.tsx), and
 * the layout's head script shows the stored choice before the first paint.
 */
import { connectFrameworkChoice } from '@/lib/framework-choice';

connectFrameworkChoice();
