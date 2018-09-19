/* eslint-disable react/prop-types */

import React from 'react'
import { mount } from 'enzyme'

import asyncComponent from '../asyncComponent'

describe('asyncComponent', () => {
  const errorResolveDelay = 20
  const promiseResolveDelay = 20

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

    describe('when multiple instances of component are present', () => {
      it('should render all instances of the component', async () => {
        const Bob = asyncComponent({
          resolve: () => Promise.resolve(() => <div>Component</div>),
          env: 'browser',
        })
        const renderWrapper = mount(
          <div>
            <Bob />
            <Bob />
          </div>,
        )
        await new Promise(resolve => setTimeout(resolve, promiseResolveDelay))
        expect(renderWrapper.html()).toMatchSnapshot()
      })

      it('should render multiple ErrorComponent', async () => {
        const Bob = asyncComponent({
          resolve: () => Promise.reject(new Error('failed to resolve')),
          ErrorComponent: ({ error }) => <div>{error.message}</div>,
          env: 'browser',
        })
        const renderWrapper = mount(
          <div>
            <Bob />
            <Bob />
          </div>,
        )
        await new Promise(resolve => setTimeout(resolve, errorResolveDelay))
        expect(renderWrapper.html()).toMatchSnapshot()
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
