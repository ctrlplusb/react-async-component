/* eslint-disable react/prop-types */

import React from 'react'
import PropTypes from 'prop-types'
import { renderToStaticMarkup } from 'react-dom/server'
import { mount } from 'enzyme'
import asyncBootstrapper from 'react-async-bootstrapper'
import { AsyncComponentProvider, createAsyncContext, asyncComponent } from '../'

const waitFor = time => new Promise(resolve => setTimeout(resolve, time))

const createApp = (asyncContext, stateForClient) => {
  // All the component creation needs to be within to respect the window
  // existing or note, which indicates a browser vs. server environment.

  function Bob({ children }) {
    return <div>{children}</div>
  }
  Bob.propTypes = { children: PropTypes.node }
  Bob.defaultProps = { children: null }

  const AsyncBob = asyncComponent({
    resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
    name: 'AsyncBob',
  })

  const AsyncBobTwo = asyncComponent({
    resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
    name: 'AsyncBobTwo',
  })

  const AsyncBobThree = asyncComponent({
    resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
    name: 'AsyncBobThree',
  })

  const DeferredAsyncBob = asyncComponent({
    resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
    serverMode: 'defer',
    name: 'DeferredAsyncBob',
    LoadingComponent: () => <div>DeferredAsyncBob Loading</div>,
  })

  const BoundaryAsyncBob = asyncComponent({
    resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
    serverMode: 'boundary',
    name: 'BoundaryAsyncBob',
  })

  return {
    AsyncBob,
    AsyncBobTwo,
    AsyncBobThree,
    DeferredAsyncBob,
    BoundaryAsyncBob,
    app: (
      <AsyncComponentProvider
        asyncContext={asyncContext}
        rehydrateState={stateForClient}
      >
        <div>
          <AsyncBob>
            <AsyncBobTwo>
              <span>In Render.</span>
            </AsyncBobTwo>
            <DeferredAsyncBob>
              <span>In Defer.</span>
            </DeferredAsyncBob>
            <BoundaryAsyncBob>
              <span>
                In Boundary but outside an AsyncComponent, server render me!
              </span>
              <AsyncBobThree>
                <span>In Boundary - Do not server render me!</span>
              </AsyncBobThree>
            </BoundaryAsyncBob>
          </AsyncBob>
        </div>
      </AsyncComponentProvider>
    ),
  }
}

const ErrorComponent = ({ error }) => <div>{error ? error.message : null}</div>
const LoadingComponent = () => <div>Loading...</div>

describe('integration tests', () => {
  it('server rendering with client rehydration', () => {
    // we have to delete the window to emulate a server only environment
    let windowTemp = global.window
    delete global.window

    // "Server" side render...
    const serverContext = createAsyncContext()
    const { app: serverApp } = createApp(serverContext)
    return asyncBootstrapper(serverApp)
      .then(() => {
        const serverString = renderToStaticMarkup(serverApp)
        expect(serverString).toMatchSnapshot()
        const stateForClient = serverContext.getState()
        expect(stateForClient).toMatchSnapshot()
        // Restore the window and attach the state to the "window" for the
        // client
        global.window = windowTemp
        return { serverHTML: serverString, stateForClient }
      })
      .then(({ serverHTML, stateForClient }) => {
        // "Client" side render...
        const clientContext = createAsyncContext()
        const { app: clientApp } = createApp(clientContext, stateForClient)
        return (
          asyncBootstrapper(clientApp)
            .then(() => {
              const clientRenderWrapper = mount(clientApp)
              expect(clientRenderWrapper).toMatchSnapshot()

              windowTemp = global.window
              delete global.window
              expect(renderToStaticMarkup(clientApp)).toEqual(serverHTML)
              global.window = windowTemp

              return clientRenderWrapper
            })
            // Now give the client side components time to resolve
            .then(
              clientRenderWrapper =>
                new Promise(resolve =>
                  setTimeout(() => resolve(clientRenderWrapper), 100),
                ),
            )
            // Now a full render should have occured on client
            .then(clientRenderWrapper => {
              clientRenderWrapper.update()
              expect(clientRenderWrapper).toMatchSnapshot()
            })
        )
      })
  })

  describe('browser rendering', () => {
    it('renders the ErrorComponent', async () => {
      const AsyncComponent = asyncComponent({
        resolve: () => {
          throw new Error('An error occurred')
        },
        ErrorComponent,
      })
      const app = (
        <AsyncComponentProvider asyncContext={createAsyncContext()}>
          <AsyncComponent />
        </AsyncComponentProvider>
      )
      await asyncBootstrapper(app)
      const wrapper = mount(app)
      await waitFor(1)
      expect(wrapper.html()).toContain('An error occurred')
    })

    it('a component only gets resolved once', async () => {
      let resolveCount = 0
      const AsyncComponent = asyncComponent({
        resolve: () => {
          resolveCount += 1
          return () => <div>foo</div>
        },
      })
      const app = (
        <AsyncComponentProvider asyncContext={createAsyncContext()}>
          <AsyncComponent />
        </AsyncComponentProvider>
      )
      await asyncBootstrapper(app)
      mount(app)
      expect(resolveCount).toEqual(1)
      mount(app)
      expect(resolveCount).toEqual(1)
    })

    it('renders the LoadingComponent', async () => {
      const AsyncComponent = asyncComponent({
        resolve: () =>
          new Promise(resolve =>
            setTimeout(() => resolve(() => <div>foo</div>), 100),
          ),
        LoadingComponent,
      })
      const app = (
        <AsyncComponentProvider asyncContext={createAsyncContext()}>
          <AsyncComponent />
        </AsyncComponentProvider>
      )
      await asyncBootstrapper(app)
      const wrapper = mount(app)
      expect(wrapper.html()).toContain('Loading...')
    })

    it('renders the LoadingComponent without bootstrapper', async () => {
      const AsyncComponent = asyncComponent({
        resolve: () =>
          new Promise(resolve =>
            setTimeout(() => resolve(() => <div>foo</div>), 100),
          ),
        LoadingComponent,
      })
      const Comp = ({ compKey }) => (
        <div>{compKey ? <AsyncComponent key={compKey} /> : null}</div>
      )
      const wrapper = mount(<Comp compKey="1" />)
      expect(wrapper.html()).toContain('Loading...')
      // Unmount the component immediately
      wrapper.setProps({
        compKey: '2',
      })
      expect(wrapper.html()).toContain('Loading...')
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(wrapper.html()).not.toContain('Loading...')
    })
  })

  describe('server rendering', () => {
    it('should render errors', async () => {
      const AsyncComponent = asyncComponent({
        resolve: () => Promise.reject(new Error('An error occurred')),
        ErrorComponent,
        env: 'node',
      })
      const asyncContext = createAsyncContext()
      const app = (
        <AsyncComponentProvider asyncContext={asyncContext}>
          <AsyncComponent />
        </AsyncComponentProvider>
      )
      await asyncBootstrapper(app)
      expect(renderToStaticMarkup(app)).toContain('An error occurred')
    })
  })
})
