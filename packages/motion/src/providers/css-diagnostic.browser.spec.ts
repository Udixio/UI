import { it } from 'vitest';
import { cssProvider } from './css.js';
it('diagnostic', async () => {
 const target = document.createElement('div'); document.body.append(target);
 const handle = cssProvider.animate({target, keyframes:[{opacity:0},{opacity:1}], timing:{duration:100,delay:50,easing:'linear'}});
 const animation = target.getAnimations()[0]; const original = animation.commitStyles.bind(animation);
 animation.commitStyles = () => { console.log('BEFORE', animation.currentTime, animation.playState, getComputedStyle(target).opacity, target.style.opacity); original(); console.log('AFTER', animation.currentTime, animation.playState, getComputedStyle(target).opacity, target.style.opacity); };
 handle.pause(); handle.seek(100); handle.play(); console.log('RESULT', await handle.finished, getComputedStyle(target).opacity, target.style.opacity); target.remove();
});
