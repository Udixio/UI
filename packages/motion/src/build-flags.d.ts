/**
 * The development checks, as a build-time flag. The default build replaces `__MOTION_CHECKS__` with the test that reads
 * `process` (a page with no bundler has no `process`, so its checks are off), and the `development` build replaces it with
 * `true`, so that a bundler's development build keeps its checks in a browser too. Tests define it as the same test.
 */
declare const __MOTION_CHECKS__: boolean;
