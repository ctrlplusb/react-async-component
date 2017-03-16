/* eslint-disable import/prefer-default-export */

// Duck type promise check.
export const isPromise = x =>
  typeof x === 'object' && typeof x.then === 'function'
