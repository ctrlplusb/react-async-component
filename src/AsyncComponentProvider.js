import React from 'react'

import createContext from './createContext'

class AsyncComponentProvider extends React.Component {
  componentWillMount() {
    this.execContext = this.props.execContext || createContext()
    this.rehydrateState = this.props.initialState
  }

  getChildContext() {
    return {
      asyncComponents: {
        getNextId: this.execContext.getNextId,
        registerComponent: this.execContext.registerComponent,
        getComponent: this.execContext.getComponent,
        registerError: this.execContext.registerError,
        getError: this.execContext.getError,
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
  execContext: React.PropTypes.shape({
    getNextId: React.PropTypes.func.isRequired,
    registerComponent: React.PropTypes.func.isRequired,
    getComponent: React.PropTypes.func.isRequired,
    registerError: React.PropTypes.func.isRequired,
    getError: React.PropTypes.func.isRequired,
  }),
  initialState: React.PropTypes.shape({
    resolved: React.PropTypes.object,
    errors: React.PropTypes.object,
  }),
}

AsyncComponentProvider.defaultProps = {
  execContext: undefined,
  initialState: {
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
