/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import type { ExecContext, ProviderChildContext } from './types';

type Props = {
  // eslint-disable-next-line
  children?: any,
  execContext: ExecContext,
};

class AsyncComponentProvider extends React.Component {
  props: Props

  getChildContext() : ProviderChildContext {
    return {
      asyncComponents: {
        getNextId: this.props.execContext.getNextId,
        getComponent: this.props.execContext.getComponent,
        registerComponent: this.props.execContext.registerComponent,
      },
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}

AsyncComponentProvider.propTypes = {
  children: PropTypes.node.isRequired,
  execContext: PropTypes.shape({
    getNextId: PropTypes.func.isRequired,
    getComponent: PropTypes.func.isRequired,
    registerComponent: PropTypes.func.isRequired,
  }).isRequired,
};

AsyncComponentProvider.childContextTypes = {
  asyncComponents: PropTypes.shape({
    getNextId: PropTypes.func.isRequired,
    getComponent: PropTypes.func.isRequired,
    registerComponent: PropTypes.func.isRequired,
  }).isRequired,
};

export default AsyncComponentProvider;
