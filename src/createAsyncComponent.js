import React from 'react'

import { STATE_IDENTIFIER } from './constants'

const validSSRModes = ['render', 'defer', 'boundary']

function createAsyncComponent(args) {
  const {
    name,
    resolve,
    es6Aware = true,
    ssrMode = 'render',
    LoadingComponent,
    ErrorComponent,
  } = args

  if (validSSRModes.indexOf(ssrMode) === -1) {
    throw new Error('Invalid ssrMode provided to createAsyncComponent')
  }

  let id = null

  // Takes the given module and if it has a ".default" the ".default" will
  // be returned. i.e. handy when you could be dealing with es6 imports.
  const es6Resolve = x =>
    es6Aware &&
      (typeof x === 'function' || typeof x === 'object') &&
      typeof x.default !== 'undefined'
      ? x.default
      : x

  const getResolver = () => {
    let resolver
    try {
      resolver = resolve()
    } catch (err) {
      return Promise.reject(err)
    }

    // Just in case the user is returning the component synchronously, we
    // will ensure it gets wrapped into a promise
    return Promise.resolve(resolver)
  }

  class AsyncComponent extends React.Component {
    constructor(props, context) {
      super(props)

      this.state = { Component: null }

      // Assign a unique id to this instance if it hasn't already got one.
      const { asyncComponents } = context
      const { getNextId } = asyncComponents
      if (!id) {
        id = getNextId()
      }
    }

    getChildContext() {
      return {
        asyncComponentsAncestor: {
          isBoundary: ssrMode === 'boundary',
        },
      }
    }

    componentDidMount() {
      const { asyncComponents } = this.context
      const { getComponent, getError } = asyncComponents
      if (!getError(id) && !getComponent(id)) {
        this.resolveComponent()
      }
    }

    asyncBootstrapperTarget() {
      const { asyncComponents } = this.context
      const { registerError } = asyncComponents

      if (typeof window !== 'undefined') {
        // Browser based logic
        if (window[STATE_IDENTIFIER]) {
          if (window[STATE_IDENTIFIER].errors[id]) {
            registerError(id, window[STATE_IDENTIFIER].errors[id])
          } else if (window[STATE_IDENTIFIER].resolved[id]) {
            return this.resolveComponent().then((Component) => {
              if (typeof Component === 'function') {
                delete window[STATE_IDENTIFIER].resolved[id]
                return true
              }
              return false
            })
          }
        }
        return false
      }

      // Node based logic

      const { asyncComponentsAncestor } = this.context
      const isChildOfBoundary = asyncComponentsAncestor &&
        asyncComponentsAncestor.isBoundary

      if (ssrMode === 'defer' || isChildOfBoundary) {
        return false
      }

      return this.resolveComponent().then(
        Component => typeof Component === 'function',
      )
    }

    resolveComponent() {
      return getResolver()
        .then((Component) => {
          if (this.unmounted) {
            return undefined
          }
          this.context.asyncComponents.registerComponent(id, Component)
          if (this.setState) {
            this.setState({
              Component: es6Resolve(Component),
            })
          }
          return Component
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('Error resolving async component:')
            // eslint-disable-next-line no-console
            console.log(error)
          }
          this.context.asyncComponents.registerError(id, error.message)
          this.setState({ error: error.message })
          return undefined
        })
    }

    componentWillUnmount() {
      this.unmounted = true
    }

    render() {
      const { asyncComponents } = this.context
      const { getComponent, getError } = asyncComponents

      const error = getError(id)
      if (error) {
        return ErrorComponent ? <ErrorComponent message={error} /> : null
      }

      const Component = es6Resolve(getComponent(id))
      // eslint-disable-next-line no-nested-ternary
      return Component
        ? <Component {...this.props} />
        : LoadingComponent ? <LoadingComponent {...this.props} /> : null
    }
  }

  AsyncComponent.childContextTypes = {
    asyncComponentsAncestor: React.PropTypes.shape({
      isBoundary: React.PropTypes.bool,
    }).isRequired,
  }

  AsyncComponent.contextTypes = {
    asyncComponentsAncestor: React.PropTypes.shape({
      isBoundary: React.PropTypes.bool,
    }),
    asyncComponents: React.PropTypes.shape({
      getNextId: React.PropTypes.func.isRequired,
      getComponent: React.PropTypes.func.isRequired,
      registerComponent: React.PropTypes.func.isRequired,
      registerError: React.PropTypes.func.isRequired,
      getError: React.PropTypes.func.isRequired,
    }).isRequired,
  }

  AsyncComponent.displayName = name || 'AsyncComponent'

  return AsyncComponent
}

export default createAsyncComponent
