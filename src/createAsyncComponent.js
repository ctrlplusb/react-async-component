import React from 'react';

// Duck type promise check.
const isPromise = x => typeof x === 'object' && typeof x.then === 'function';

const validSSRModes = ['render', 'defer', 'boundary'];

function createAsyncComponent(args) {
  const {
    name,
    resolve,
    es6Aware = true,
    ssrMode = 'render',
    Loading,
  } = args;

  if (validSSRModes.indexOf(ssrMode) === -1) {
    throw new Error('Invalid ssrMode provided to createAsyncComponent');
  }

  let id = null;

  // Takes the given module and if it has a ".default" the ".default" will
  // be returned. i.e. handy when you could be dealing with es6 imports.
  const es6Resolve = x => (
    es6Aware
    && (typeof x === 'function' || typeof x === 'object')
    && typeof x.default !== 'undefined'
      ? x.default
      : x
  );

  const getResolver = () => {
    const resolver = resolve();
    if (!isPromise(resolver)) {
      throw new Error('The "resolve" function on an AsyncComponent should return a Promise');
    }
    return resolver;
  };

  class AsyncComponent extends React.Component {
    constructor(props, context) {
      super(props);

      const { asyncComponents, asyncComponentsAncestor } = context;

      this.state = { Component: null };

      // Assign a unique id to this instance if it hasn't already got one.
      // Note: the closure usage.
      const { getNextId, getComponent } = asyncComponents;
      if (!id) {
        id = getNextId();
      }

      // Try resolve the component.
      const Component = es6Resolve(getComponent(id));
      if (Component) {
        this.state = { Component };
      } else {
        this.getAsyncComponentData = () => ({
          id,
          defer: ssrMode === 'defer'
            || (asyncComponentsAncestor && asyncComponentsAncestor.isBoundary),
          getResolver: () => this.resolveComponent(),
        });
      }
    }

    getChildContext() {
      if (ssrMode !== 'boundary') {
        return undefined;
      }
      return {
        asyncComponentsAncestor: {
          isBoundary: true,
        },
      };
    }

    componentDidMount() {
      if (!this.state.Component) {
        this.resolveComponent(this.props);
      }
    }

    resolveComponent() {
      return getResolver().then((Component) => {
        if (this.unmounted) {
          // The component is unmounted, so no need to set the state.
          return;
        }
        this.context.asyncComponents.registerComponent(id, Component);
        if (this.setState) {
          this.setState({
            Component: es6Resolve(Component),
          });
        }
      });
    }

    componentWillUnmount() {
      this.unmounted = true;
    }

    render() {
      const { Component } = this.state;
      // eslint-disable-next-line no-nested-ternary
      return Component
        ? <Component {...this.props} />
        : Loading
        ? <Loading {...this.props} />
        : null;
    }
  }

  AsyncComponent.childContextTypes = {
    asyncComponentsAncestor: React.PropTypes.shape({
      isBoundary: React.PropTypes.bool,
    }),
  };

  AsyncComponent.contextTypes = {
    asyncComponents: React.PropTypes.shape({
      getNextId: React.PropTypes.func.isRequired,
      getComponent: React.PropTypes.func.isRequired,
      registerComponent: React.PropTypes.func.isRequired,
    }).isRequired,
  };

  AsyncComponent.displayName = name || 'AsyncComponent';

  return AsyncComponent;
}

export default createAsyncComponent;
