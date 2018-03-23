import React from 'react'
import PropTypes from 'prop-types'

const validSSRModes = ['resolve', 'defer', 'boundary']

export default function asyncComponent(config) {
  const {
    name,
    resolve,
    autoResolveES2015Default = true,
    serverMode = 'resolve',
    LoadingComponent,
    ErrorComponent,
  } = config

  if (validSSRModes.indexOf(serverMode) === -1) {
    throw new Error('Invalid serverMode provided to asyncComponent')
  }

  const env =
    ['node', 'browser'].indexOf(config.env) > -1
      ? config.env
      : typeof window === 'undefined' ? 'node' : 'browser'

  const state = {
    // A unique id we will assign to our async component which is especially
    // useful when rehydrating server side rendered async components.
    id: null,
    // This will be use to hold the resolved module allowing sharing across
    // instances.
    // NOTE: When using React Hot Loader this reference will become null.
    module: null,
    // If an error occurred during a resolution it will be stored here.
    error: null,
    // Allows us to share the resolver promise across instances.
    resolver: null,
    // Indicates whether resolving is taking place
    resolving: false,
    // Handle on the contexts so we don't lose it during async resolution
    asyncComponents: null,
    asyncComponentsAncestor: null,
  }

  const needToResolveOnBrowser = () =>
    state.module == null &&
    state.error == null &&
    !state.resolving &&
    typeof window !== 'undefined'

  // Takes the given module and if it has a ".default" the ".default" will
  // be returned. i.e. handy when you could be dealing with es6 imports.
  const es6Resolve = x =>
    autoResolveES2015Default &&
    x != null &&
    (typeof x === 'function' || typeof x === 'object') &&
    x.default
      ? x.default
      : x

  const getResolver = () => {
    if (state.resolver == null) {
      state.resolving = true
      try {
        state.resolver = Promise.resolve(resolve())
      } catch (err) {
        state.resolver = Promise.reject(err)
      }
    }
    return state.resolver
  }

  return class AsyncComponent extends React.Component {
    static displayName = name || 'AsyncComponent'

    static contextTypes = {
      asyncComponentsAncestor: PropTypes.shape({
        isBoundary: PropTypes.bool,
      }),
      asyncComponents: PropTypes.shape({
        getNextId: PropTypes.func.isRequired,
        resolved: PropTypes.func.isRequired,
        shouldRehydrate: PropTypes.func.isRequired,
      }),
    }

    static childContextTypes = {
      asyncComponentsAncestor: PropTypes.shape({
        isBoundary: PropTypes.bool,
      }),
    }

    getChildContext() {
      return {
        asyncComponentsAncestor:
          state.asyncComponents == null
            ? null
            : {
                isBoundary: serverMode === 'boundary',
              },
      }
    }

    componentWillMount() {
      if (this.context.asyncComponents != null) {
        state.asyncComponents = this.context.asyncComponents
        state.asyncComponentsAncestor = this.context.asyncComponentsAncestor
        if (!state.id) {
          state.id = this.context.asyncComponents.getNextId()
        }
      }
    }

    // react-async-bootstrapper
    bootstrap() {
      const doResolve = () =>
        this.resolveModule().then(
          module => (module === undefined ? false : undefined),
        )

      // browser
      if (env === 'browser') {
        const { shouldRehydrate, getError } = state.asyncComponents
        const error = getError(state.id)
        if (error) {
          state.error = error
          return false
        }
        return shouldRehydrate(state.id) ? doResolve() : false
      }

      // node
      const isChildOfBoundary =
        state.asyncComponentsAncestor != null &&
        state.asyncComponentsAncestor.isBoundary

      return serverMode === 'defer' || isChildOfBoundary ? false : doResolve()
    }

    componentDidMount() {
      if (needToResolveOnBrowser()) {
        this.resolveModule()
      }
    }

    resolveModule() {
      return getResolver()
        .then(module => {
          if (state.asyncComponents != null) {
            state.asyncComponents.resolved(state.id)
          }
          state.module = module
          state.error = null
          state.resolving = false
          return module
        })
        .catch(({ message, stack }) => {
          const error = { message, stack }
          if (state.asyncComponents != null) {
            state.asyncComponents.failed(state.id, error)
          }
          state.error = error
          state.resolving = false
          if (!ErrorComponent) {
            // eslint-disable-next-line no-console
            console.error(error)
          }
        })
        .then(result => {
          if (this.unmounted) {
            return undefined
          }
          if (
            !this.context.reactAsyncBootstrapperRunning &&
            env === 'browser'
          ) {
            this.forceUpdate()
          }
          return result
        })
    }

    componentWillUnmount() {
      this.unmounted = true
    }

    render() {
      const { module, error } = state

      if (error) {
        return ErrorComponent ? (
          <ErrorComponent {...this.props} error={error} />
        ) : null
      }

      const Component = es6Resolve(module)
      return Component ? (
        <Component {...this.props} />
      ) : LoadingComponent ? (
        <LoadingComponent {...this.props} />
      ) : null
    }
  }
}
