/* @flow */

import React from 'react'
import reactTreeWalker from 'react-tree-walker'
import AsyncComponentProvider from './AsyncComponentProvider'
import { STATE_IDENTIFIER } from './constants'
import type { React$Element } from './types'

function createExecContext() {
  let idPointer = 0
  const registry = {}
  return {
    getNextId: () => {
      idPointer += 1
      return idPointer
    },
    registerComponent(id, Component) {
      registry[id] = Component
    },
    getComponent(id) {
      return registry[id]
    },
    getResolved() {
      return Object.keys(registry).reduce(
        (acc, cur) => Object.assign(acc, { [cur]: true }),
        {},
      )
    },
  }
}

type Result = {
  appWithAsyncComponents : React$Element,
  state? : { resolved: Array<number> },
  STATE_IDENTIFIER? : string,
}

export default function withAsyncComponents(app : React$Element) : Promise<Result> {
  const execContext = createExecContext()

  const isBrowser = typeof window !== 'undefined'
  const rehydrateState = isBrowser
    && typeof window[STATE_IDENTIFIER] !== 'undefined'
    ? window[STATE_IDENTIFIER]
    : null

  const appWithAsyncComponents = (
    <AsyncComponentProvider execContext={execContext}>
      {app}
    </AsyncComponentProvider>
  )

  if (isBrowser && !rehydrateState) {
    return Promise.resolve({
      appWithAsyncComponents,
    })
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

  return reactTreeWalker(appWithAsyncComponents, visitor, {})
    // Swallow errors.
    .catch(() => undefined)
    // Ensure that state rehydration is killed
    .then(() => { if (typeof window === 'object') { window[STATE_IDENTIFIER] = null } })
    .then(() => ({
      appWithAsyncComponents,
      state: { resolved: execContext.getResolved() },
      STATE_IDENTIFIER,
    }))
}
