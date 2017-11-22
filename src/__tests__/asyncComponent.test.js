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

      it('can retry resolving', async () => {
        class RetryingError extends React.Component {
          componentDidMount() {
            setTimeout(() => this.props.retry(), 1)
          }
          render() {
            return <div>{this.props.error.message}</div>
          }
        }
        const asyncProps = {
          resolve: jest.fn(() =>
            Promise.reject(new Error('failed to resolve')),
          ),
          ErrorComponent: RetryingError,
          env: 'browser',
        }
        const Bob = asyncComponent(asyncProps)
        const renderWrapper = mount(<Bob />)

        asyncProps.resolve.mockImplementation(() =>
          Promise.resolve(() => <h1>I loaded now!</h1>),
        )

        await new Promise(resolve =>
          setTimeout(() => {
            expect(renderWrapper.html()).toMatchSnapshot()
            setTimeout(() => {
              expect(renderWrapper.html()).toMatchSnapshot()
              resolve()
            }, errorResolveDelay)
          }, errorResolveDelay),
        )
      })
    })
  })

  describe('in a server environment', () => {
    describe('when an error occurs resolving a component', () => {
      it('should not render the ErrorComponent', async () => {
        const consoleSpy = jest
          .spyOn(console, 'warn')
          .mockImplementation(() => true)
        const Bob = asyncComponent({
          resolve: () => Promise.reject(new Error('failed to resolve')),
          ErrorComponent: ({ error }) => <div>{error.message}</div>,
          env: 'node',
        })
        const renderWrapper = mount(<Bob />)
        await new Promise(resolve => setTimeout(resolve, errorResolveDelay))
        expect(renderWrapper.html()).toMatchSnapshot()
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to resolve asyncComponent',
        )
      })
    })
  })
})
