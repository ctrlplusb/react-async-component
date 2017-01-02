/* @flow */

import React, { PropTypes } from 'react';

// $FlowFixMe - using propTypes
function MyComponent({ msg }) {
  return <h1>{msg}</h1>;
}

MyComponent.propTypes = {
  msg: PropTypes.string.isRequired,
};

export default MyComponent;
