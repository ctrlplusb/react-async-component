/* eslint-disable react/prop-types */

import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'

import asyncComponent from '../asyncComponent'

describe('asyncComponent', () => {
  const errorResolveDelay = 20

  it('should handle unmounting ensuring that resolved promises do not call setState', async () => {
    const Bob = asyncComponent({
      chunkName: 'bob',
      resolve: () => Promise.resolve(() => <div>bob</div>),
    })
    const setStateSpy = sinon.spy(Bob.prototype, 'setState')
    const renderWrapper = mount(<Bob />)
    // Should have 1 initial setState call for mounting
    expect(setStateSpy.callCount).toEqual(1)
    renderWrapper.unmount()
    await new Promise(resolve => setTimeout(resolve, 1))
    expect(setStateSpy.callCount).toEqual(1)
  })

  describe('in a browser environment', () => {
    describe('when an error occurs resolving a component', () => {
      it.only('should render the ErrorComponent', async () => {
        const Bob = asyncComponent({
          chunkName: 'bob',
          resolve: () => Promise.reject(new Error('failed to resolve')),
          ErrorComponent: ({ error }) => <div>{error.message}</div>,
          env: 'browser',
        })
        const renderWrapper = mount(<Bob />)
        await new Promise(resolve => setTimeout(resolve, errorResolveDelay))
        expect(renderWrapper.html()).toMatchSnapshot()
      })
    })
  })

  describe('in a server environment', () => {
    describe('when an error occurs resolving a component', () => {
      it('should not render the ErrorComponent', async () => {
        const Bob = asyncComponent({
          chunkName: 'bob',
          resolve: () => Promise.reject(new Error('failed to resolve')),
          ErrorComponent: ({ error }) => <div>{error.message}</div>,
          env: 'node',
        })
        const renderWrapper = mount(<Bob />)
        await new Promise(resolve => setTimeout(resolve, errorResolveDelay))
        expect(renderWrapper.html()).toMatchSnapshot()
      })
    })
  })
})
