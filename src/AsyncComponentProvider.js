/* @flow */

import React from 'react'
import type { ExecContext, ProviderChildContext } from './types'

import createContext from './createContext'

type Props = {
  // eslint-disable-next-line
  children?: any,
  execContext?: ExecContext,
};

class AsyncComponentProvider extends React.Component {
  props: Props
  execContext: ExecContext

  constructor(props : Props, context : Object) {
    super(props, context)

    this.execContext = props.execContext || createContext()
  }

  getChildContext() : ProviderChildContext {
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
