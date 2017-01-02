/* @flow */

import React from 'react';
import MyComponent from '../src/MyComponent';
import describeComponent from './__helpers__/describeComponent';

describeComponent('MyComponent', () => {
  it('renders', () => {
    expect(<MyComponent msg="foo" />).toMatchSnapshot();
  });

  it('propTypes', () => {
    expect(() => <MyComponent />).toThrowError('Failed prop type');
  });
});
