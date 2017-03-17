import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { mount } from 'enzyme'
import asyncBootstrapper from 'react-async-bootstrapper'

import {
  AsyncComponentProvider,
  createAsyncContext,
  asyncComponent,
} from '../'

function Bob({ children }) {
  return <div>{children}</div>
}
Bob.propTypes = { children: React.PropTypes.node }
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
  ssrMode: 'defer',
  name: 'DeferredAsyncBob',
  LoadingComponent: () => <div>DeferredAsyncBob Loading</div>,
})

const BoundaryAsyncBob = asyncComponent({
  resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
  ssrMode: 'boundary',
  name: 'BoundaryAsyncBob',
})

const ErrorAsyncComponent = asyncComponent({
  resolve: () =>
    new Promise(() => {
      throw new Error('This always errors')
    }),
  name: 'ErrorAsyncComponent',
  // eslint-disable-next-line react/prop-types
  ErrorComponent: ({ message }) => <div>{message}</div>,
})

const createApp = (asyncContext, stateForClient) => (
  <AsyncComponentProvider
    asyncContext={asyncContext}
    rehydrateState={stateForClient}
  >
    <AsyncBob>
      <div>
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
        <ErrorAsyncComponent />
      </div>
    </AsyncBob>
  </AsyncComponentProvider>
)

describe('integration tests', () => {
  it('render server and client', () => {
    // we have to delete the window to emulate a server only environment
    const windowTemp = global.window
    delete global.window

    // "Server" side render...
    const serverContext = createAsyncContext()
    const serverApp = createApp(serverContext)
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
        const clientApp = createApp(clientContext, stateForClient)
        return (
          asyncBootstrapper(clientApp)
            .then(() => {
              const clientRenderWrapper = mount(clientApp)
              expect(clientRenderWrapper).toMatchSnapshot()
              expect(renderToStaticMarkup(clientApp)).toEqual(serverHTML)
              return clientRenderWrapper
            })
            // Now give the client side components time to resolve
            .then(
              clientRenderWrapper =>
                new Promise(resolve =>
                  setTimeout(() => resolve(clientRenderWrapper), 100)),
            )
            // Now a full render should have occured on client
            .then(clientRenderWrapper =>
              expect(clientRenderWrapper).toMatchSnapshot())
        )
      })
  })

  it('renders the LoadingComponent', () => {
    const Foo = asyncComponent({
      resolve: () =>
        new Promise(resolve =>
          setTimeout(() => resolve(() => <div>foo</div>), 100)),
      LoadingComponent: () => <div>Loading...</div>,
    })

    const asyncContext = createAsyncContext()

    const app = (
      <AsyncComponentProvider asyncContext={asyncContext}>
        <Foo />
      </AsyncComponentProvider>
    )

    return asyncBootstrapper(app)
      .then(() => mount(app))
      .then(render => expect(render).toMatchSnapshot())
  })

  it('renders the ErrorComponent', () => {
    const Foo = asyncComponent({
      resolve: () => {
        throw new Error('An error occurred')
      },
      // eslint-disable-next-line react/prop-types
      ErrorComponent: ({ message }) => <div>{message}</div>,
    })

    const asyncContext = createAsyncContext()

    const app = (
      <AsyncComponentProvider asyncContext={asyncContext}>
        <Foo />
      </AsyncComponentProvider>
    )

    return asyncBootstrapper(app)
      .then(
        () =>
          new Promise((resolve) => {
            const rendered = mount(app)
            setTimeout(() => resolve(rendered), 100)
          }),
      )
      .then(render => expect(render).toMatchSnapshot())
  })

  it('a component only gets resolved once', () => {
    let resolveCount = 0

    const Foo = asyncComponent({
      resolve: () => {
        resolveCount += 1
        return () => <div>foo</div>
      },
    })

    const asyncContext = createAsyncContext()

    const app = (
      <AsyncComponentProvider asyncContext={asyncContext}>
        <Foo />
      </AsyncComponentProvider>
    )

    return asyncBootstrapper(app)
      .then(() => mount(app))
      .then(() => expect(resolveCount).toEqual(1))
      .then(() => mount(app))
      .then(() => expect(resolveCount).toEqual(1))
  })
})
