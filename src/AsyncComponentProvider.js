import React from 'react'

import createAsyncContext from './createAsyncContext'

class AsyncComponentProvider extends React.Component {
  componentWillMount() {
    this.asyncContext = this.props.asyncContext || createAsyncContext()
    this.rehydrateState = this.props.rehydrateState
  }

  getChildContext() {
    return {
      asyncComponents: {
        getNextId: this.asyncContext.getNextId,
        registerComponent: this.asyncContext.registerComponent,
        getComponent: this.asyncContext.getComponent,
        registerError: this.asyncContext.registerError,
        getError: this.asyncContext.getError,
        getRehydrate: (id) => {
          const error = this.rehydrateState.errors[id]
          const resolved = this.rehydrateState.resolved[id]
          delete this.rehydrateState.errors[id]
          delete this.rehydrateState.resolved[id]
          return {
            // eslint-disable-next-line no-nested-ternary
            type: error ? 'error' : resolved ? 'resolved' : 'unresolved',
            error,
          }
        },
      },
    }
  }

  render() {
    return React.Children.only(this.props.children)
  }
}

AsyncComponentProvider.propTypes = {
  children: React.PropTypes.node.isRequired,
  asyncContext: React.PropTypes.shape({
    getNextId: React.PropTypes.func.isRequired,
    registerComponent: React.PropTypes.func.isRequired,
    getComponent: React.PropTypes.func.isRequired,
    registerError: React.PropTypes.func.isRequired,
    getError: React.PropTypes.func.isRequired,
  }),
  rehydrateState: React.PropTypes.shape({
    resolved: React.PropTypes.object,
    errors: React.PropTypes.object,
  }),
}

AsyncComponentProvider.defaultProps = {
  asyncContext: undefined,
  rehydrateState: {
    resolved: {},
    errors: {},
  },
}

AsyncComponentProvider.childContextTypes = {
  asyncComponents: React.PropTypes.shape({
    getNextId: React.PropTypes.func.isRequired,
    registerComponent: React.PropTypes.func.isRequired,
    getComponent: React.PropTypes.func.isRequired,
    registerError: React.PropTypes.func.isRequired,
    getError: React.PropTypes.func.isRequired,
    getRehydrate: React.PropTypes.func.isRequired,
  }).isRequired,
}

export default AsyncComponentProvider
