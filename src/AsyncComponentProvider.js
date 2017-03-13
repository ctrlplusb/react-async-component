import React from 'react'

import createContext from './createContext'

class AsyncComponentProvider extends React.Component {
  constructor(props, context) {
    super(props, context)

    this.execContext = props.execContext || createContext()
  }

  getChildContext() {
    return {
      asyncComponents: {
        getNextId: this.execContext.getNextId,
        getComponent: this.execContext.getComponent,
        registerComponent: this.execContext.registerComponent,
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
    getComponent: React.PropTypes.func.isRequired,
    registerComponent: React.PropTypes.func.isRequired,
  }),
}

AsyncComponentProvider.defaultProps = {
  execContext: undefined,
}

AsyncComponentProvider.childContextTypes = {
  asyncComponents: React.PropTypes.shape({
    getNextId: React.PropTypes.func.isRequired,
    getComponent: React.PropTypes.func.isRequired,
    registerComponent: React.PropTypes.func.isRequired,
  }).isRequired,
}

export default AsyncComponentProvider
