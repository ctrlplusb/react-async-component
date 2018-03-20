/* eslint-disable react/prop-types */

import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'

import asyncComponent from '../asyncComponent'

describe('asyncComponent', () => {
  const errorResolveDelay = 20

  it('should handle unmounting ensuring that resolved promises do not call setState', async () => {
    const Bob = asyncComponent({
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
      it('should render the ErrorComponent', async () => {
        const Bob = asyncComponent({
          resolve: () => Promise.reject(new Error('failed to resolve')),
          ErrorComponent: ({ error }) => <div>{error.message}</div>,
          env: 'browser',
        })
        const renderWrapper = mount(<Bob />)
        await new Promise(resolve => setTimeout(resolve, errorResolveDelay))
        expect(renderWrapper.html()).toMatchSnapshot()
      })
    })
    describe('when resolving dynamic imports', () => {
      it('should resolve module again on module id change', async () => {
        const Dynamic = asyncComponent({
          getModuleId: props => props.name,
          resolve: props => {
            if (props.name === 'foo') {
              return ({ name }) => <div>fooComponent:&nbsp;{name}</div>
            } else {
              return ({ name }) => <div>barComponent:&nbsp;{name}</div>
            }
          },
          render: (ResolvedComponent, props) => (
            <ResolvedComponent {...props} />
          ),
          env: 'browser',
        })

        const renderWrapper = mount(<Dynamic name="test" />)
        await new Promise(resolve => setTimeout(resolve, errorResolveDelay))
        renderWrapper.update()
        expect(renderWrapper).toMatchSnapshot()
        await new Promise(resolve => {
          renderWrapper.setProps(
            {
              name: 'foo',
            },
            () => {
              setTimeout(resolve, errorResolveDelay)
            },
          )
        })
        renderWrapper.update()
        expect(renderWrapper).toMatchSnapshot()
      })
    })
  })

  describe('in a server environment', () => {
    describe('when an error occurs resolving a component', () => {
      it('should not render the ErrorComponent', async () => {
        const Bob = asyncComponent({
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
