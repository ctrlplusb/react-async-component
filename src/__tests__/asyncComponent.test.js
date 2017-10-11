import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'

import asyncComponent from '../asyncComponent'

describe('asyncComponent', () => {
  it('should handle unmounting ensuring that resolved promises do not call setState', () => {
    const resolveDelay = 10
    const Bob = asyncComponent({
      resolve: () =>
        new Promise(resolve =>
          setTimeout(() => resolve(() => <div>bob</div>), resolveDelay),
        ),
    })
    const setStateSpy = sinon.spy(Bob.prototype, 'setState')
    const renderWrapper = mount(<Bob />)
    // Should have 1 initial setState call for mounting
    expect(setStateSpy.callCount).toEqual(1)
    renderWrapper.unmount()
    return new Promise(resolve =>
      setTimeout(resolve, resolveDelay + 10),
    ).then(() => expect(setStateSpy.callCount).toEqual(1))
  })

  describe('in a browser environment', () => {
    let oldWindow
    beforeAll(() => {
      oldWindow = window
      global.window = {}
    })
    afterAll(() => {
      global.window = oldWindow
    })
    describe('when an error occurs resolving a component', () => {
      it.only('should render the ErrorComponent', () => {
        const resolveDelay = 10
        const Bob = asyncComponent({
          resolve: () =>
            new Promise((resolve, reject) =>
              setTimeout(
                () => reject(new Error('failed to resolve')),
                resolveDelay,
              ),
            ),
          ErrorComponent: ({ error }) => <div>{error.message}</div>,
        })
        const renderWrapper = mount(<Bob />)
        return new Promise(resolve =>
          setTimeout(resolve, resolveDelay + 100),
        ).then(() => expect(renderWrapper).toMatchSnapshot())
      })
    })
  })
  describe('in a server environment', () => {
    let oldWindow
    beforeAll(() => {
      oldWindow = window
      global.window = undefined
    })
    afterAll(() => {
      global.window = oldWindow
    })
    describe('when an error occurs resolving a component', () => {
      it('should render the ErrorComponent', () => {
        const resolveDelay = 10
        const Bob = asyncComponent({
          resolve: () =>
            new Promise((resolve, reject) =>
              setTimeout(
                () => reject(new Error('failed to resolve')),
                resolveDelay,
              ),
            ),
          ErrorComponent: ({ error }) => <div>{error.message}</div>,
        })
        const renderWrapper = mount(<Bob />)
        return new Promise(resolve =>
          setTimeout(resolve, resolveDelay + 50),
        ).then(() => expect(renderWrapper).toMatchSnapshot())
      })
    })
  })
})
