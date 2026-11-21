/**
 * Whether the development checks of `@udixio/motion` are on: the same test as the core's own checks. The default build
 * runs them where `process.env.NODE_ENV` is not `production` (a page with no bundler has no `process`, so they are off
 * there), and the `development` build, which a bundler's development mode selects, always runs them.
 *
 * The framework adapters pass it as the `development` option of the motions they bind, so that a misspelt name, an
 * invalid spec or an exit that holds focus is reported in development in every framework, as `connectMotion({ development:
 * true })` reports it in HTML.
 * @returns True in development.
 */
export function isMotionDevelopment(): boolean {
  return __MOTION_CHECKS__;
}
