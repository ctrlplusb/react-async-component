/* @flow */

import reactTreeWalker from 'react-tree-walker'
import { STATE_IDENTIFIER } from './constants'
import type { React$Element } from './types'

export default function withAsyncComponents(app : React$Element) : Promise<any> {
  const isBrowser = typeof window !== 'undefined'
  const rehydrateState = isBrowser
    && typeof window[STATE_IDENTIFIER] !== 'undefined'
    ? window[STATE_IDENTIFIER]
    : null

  if (isBrowser && !rehydrateState) {
    return Promise.resolve()
  }

  const visitor = (element, instance, context) => {
    if (instance && typeof instance.getAsyncComponentData === 'function') {
      const { id, ssrMode, getResolver } = instance.getAsyncComponentData()

      const isBoundary = context.asyncComponentsAncestor &&
        context.asyncComponentsAncestor.isBoundary

      if (rehydrateState != null) {
        if (!rehydrateState.resolved[id]) {
          return false
        }
        rehydrateState[id] = false
      } else if (ssrMode === 'defer' || isBoundary) {
        // Deferred, so return false to stop walking down this branch.
        return false
      }
      return getResolver()
    }
    return true
  }

  return reactTreeWalker(app, visitor, {})
    // Swallow errors.
    .catch(() => undefined)
}
