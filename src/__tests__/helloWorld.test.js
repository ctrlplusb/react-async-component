/* @flow */

import helloWorld from '../helloWorld';

describe('helloWorld', () => {
  it('returns the expected result', () => {
    const expected = 'hello world';
    const actual = helloWorld();
    expect(expected).toEqual(actual);
  });
});
