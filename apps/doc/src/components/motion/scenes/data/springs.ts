/** The spring lanes of the "Springs and tokens" scene, in the order they are shown. */
export const LANES = [
  'spring.fast.spatial',
  'spring.fast.effects',
  'spring.default.spatial',
  'spring.default.effects',
  'spring.slow.spatial',
  'spring.slow.effects',
] as const;

/** The curves of the need page: a duration and an easing token each, one bar per curve. */
export const CURVES = [
  { duration: 'duration.short4', easing: 'easing.standard' },
  { duration: 'duration.medium2', easing: 'easing.standardDecelerate' },
  { duration: 'duration.long2', easing: 'easing.standardAccelerate' },
  { duration: 'duration.extraLong1', easing: 'easing.linear' },
] as const;
