import React from 'react'
import PropTypes from 'prop-types'

import createAsyncContext from './createAsyncContext'

class AsyncComponentProvider extends React.Component {
  componentWillMount() {
    this.asyncContext = this.props.asyncContext || createAsyncContext()
    this.rehydrateState = this.props.rehydrateState
  }

  getChildContext() {
    return {
      asyncComponents: {
        resolved: this.asyncContext.resolved,
        shouldRehydrate: chunkName => {
          const resolved = this.rehydrateState.resolved[chunkName]
          delete this.rehydrateState.resolved[chunkName]
          return resolved
        },
      },
    }
  }

  render() {
    return React.Children.only(this.props.children)
  }
}

AsyncComponentProvider.propTypes = {
  children: PropTypes.node.isRequired,
  asyncContext: PropTypes.shape({
    resolved: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired,
  }),
  rehydrateState: PropTypes.shape({
    resolved: PropTypes.object,
  }),
}

AsyncComponentProvider.defaultProps = {
  asyncContext: undefined,
  rehydrateState: {
    resolved: {},
  },
}

AsyncComponentProvider.childContextTypes = {
  asyncComponents: PropTypes.shape({
    resolved: PropTypes.func.isRequired,
    shouldRehydrate: PropTypes.func.isRequired,
  }).isRequired,
}

export default AsyncComponentProvider
