import React from 'react';

// Duck type promise check.
const isPromise = x => typeof x === 'object' && typeof x.then === 'function';

function createAsyncComponent(args) {
  const {
    name,
    resolve,
    es6Aware = true,
    defer = false,
    Loading,
  } = args;

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

      this.state = { Component: null };

      if (context.asyncComponents) {
        const { asyncComponents: { nextId, getComponent } } = context;
        if (!id) {
          id = nextId();
        }
        const Component = es6Resolve(getComponent(id));
        if (Component) {
          this.state = { Component };
        } else {
          this.getAsyncComponentData = () => ({
            id,
            defer,
            getResolver,
          });
        }
      }
    }

    componentDidMount() {
      if (!this.state.Component) {
        this.resolveComponent(this.props);
      }
    }

    resolveComponent() {
      return getResolver().then(Component =>
        this.setState({
          Component: es6Resolve(Component),
        }),
      );
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

  AsyncComponent.contextTypes = {
    asyncComponents: React.PropTypes.shape({
      nextId: React.PropTypes.func.isRequired,
      getComponent: React.PropTypes.func.isRequired,
    }),
  };

  AsyncComponent.displayName = name || 'AsyncComponent';

  return AsyncComponent;
}

export default createAsyncComponent;
