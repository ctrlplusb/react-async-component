/* @flow */

import React from 'react';
import MyComponent from '../MyComponent';
import warningsToErrors from '../../tools/tests/warningsToErrors';

describe('MyComponent', () => {
  warningsToErrors();

  it('renders', () => {
    expect(<MyComponent msg="foo" />).toMatchSnapshot();
  });

  it('propTypes', () => {
    expect(() => <MyComponent />).toThrowError('Failed prop type');
  });
});
