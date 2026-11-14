/** Parse an explicit list so a typo cannot silently skip browser coverage. */
export function motionBrowsers(value = 'chromium,firefox,webkit') {
  const browsers = value.split(',').map(name => name.trim());
  if (browsers.some(name => !['chromium', 'firefox', 'webkit'].includes(name)) || new Set(browsers).size !== browsers.length) {
    throw new Error(`Invalid MOTION_BROWSERS: ${value}`);
  }
  return browsers;
}
