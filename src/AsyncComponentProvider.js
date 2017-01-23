/* @flow */

import React from 'react';
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
  children: React.PropTypes.node.isRequired,
  execContext: React.PropTypes.shape({
    getNextId: React.PropTypes.func.isRequired,
    getComponent: React.PropTypes.func.isRequired,
    registerComponent: React.PropTypes.func.isRequired,
  }).isRequired,
};

AsyncComponentProvider.childContextTypes = {
  asyncComponents: React.PropTypes.shape({
    getNextId: React.PropTypes.func.isRequired,
    getComponent: React.PropTypes.func.isRequired,
    registerComponent: React.PropTypes.func.isRequired,
  }).isRequired,
};

export default AsyncComponentProvider;
