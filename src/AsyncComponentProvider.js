/* @flow */

import React from 'react';
import type { ExecContext, ProviderChildContext } from './types';

type Props = {
  children?: any,
  execContext: ExecContext,
};

class AsyncComponentProvider extends React.Component {
  id: number;
  registry: { [key:number] : Function };

  constructor(props : Props) {
    super(props);
    this.id = 0;
    this.registry = {};
  }

  getChildContext() : ProviderChildContext {
    return {
      asyncComponents: {
        nextId: () => {
          this.id += 1;
          return this.id;
        },
        registerComponent: (id, Component) => {
          this.props.execContext.registerComponent(id, Component);
        },
        getComponent: id => this.props.execContext.getComponent(id),
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
    registerComponent: React.PropTypes.func.isRequired,
    getComponent: React.PropTypes.func.isRequired,
  }).isRequired,
};

AsyncComponentProvider.childContextTypes = {
  asyncComponents: React.PropTypes.shape({
    nextId: React.PropTypes.func.isRequired,
    registerComponent: React.PropTypes.func.isRequired,
    getComponent: React.PropTypes.func.isRequired,
  }).isRequired,
};

export default AsyncComponentProvider;
