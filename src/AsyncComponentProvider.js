import React from 'react'

import createAsyncContext from './createAsyncContext'

class AsyncComponentProvider extends React.Component {
  static propTypes = {
    children: React.PropTypes.node.isRequired,
    asyncContext: React.PropTypes.shape({
      getNextId: React.PropTypes.func.isRequired,
      resolved: React.PropTypes.func.isRequired,
      getState: React.PropTypes.func.isRequired,
    }),
    rehydrateState: React.PropTypes.shape({
      resolved: React.PropTypes.object,
    }),
  };

  static defaultProps = {
    asyncContext: undefined,
    rehydrateState: {
      resolved: {},
    },
  };

  static childContextTypes = {
    asyncComponents: React.PropTypes.shape({
      getNextId: React.PropTypes.func.isRequired,
      resolved: React.PropTypes.func.isRequired,
      shouldRehydrate: React.PropTypes.func.isRequired,
    }).isRequired,
  };

  componentWillMount() {
    this.asyncContext = this.props.asyncContext || createAsyncContext()
    this.rehydrateState = this.props.rehydrateState
  }

  getChildContext() {
    return {
      asyncComponents: {
        getNextId: this.asyncContext.getNextId,
        resolved: this.asyncContext.resolved,
        shouldRehydrate: (id) => {
          const resolved = this.rehydrateState.resolved[id]
          delete this.rehydrateState.resolved[id]
          return resolved
        },
      },
    }
  }

  render() {
    return React.Children.only(this.props.children)
  }
}

export default AsyncComponentProvider
