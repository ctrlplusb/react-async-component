import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { mount } from 'enzyme'

import {
  AsyncComponentProvider,
  createContext,
  createAsyncComponent,
  withAsyncComponents,
  STATE_IDENTIFIER,
} from '../'

function Bob({ children }) {
  return <div>{children}</div>
}
Bob.propTypes = { children: React.PropTypes.node }
Bob.defaultProps = { children: null }

const AsyncBob = createAsyncComponent({
  resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
  name: 'AsyncBob',
})

const AsyncBobTwo = createAsyncComponent({
  resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
  name: 'AsyncBobTwo',
})

const AsyncBobThree = createAsyncComponent({
  resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
  name: 'AsyncBobThree',
})

const DeferredAsyncBob = createAsyncComponent({
  resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
  ssrMode: 'defer',
  name: 'DeferredAsyncBob',
})

const BoundaryAsyncBob = createAsyncComponent({
  resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
  ssrMode: 'boundary',
  name: 'BoundaryAsyncBob',
})

const app = execContext => (
  <AsyncComponentProvider execContext={execContext}>
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
      </div>
    </AsyncBob>
  </AsyncComponentProvider>
)

describe('integration tests', () => {
  afterEach(() => {
    delete global.window[STATE_IDENTIFIER]
  })

  it('render server and client', () => {
    const windowTemp = global.window
    // we have to delete the window to emulate a server only environment
    delete global.window

    // "Server" side render...
    const serverContext = createContext()
    const serverApp = app(serverContext)
    return withAsyncComponents(serverApp)
      .then(() => {
        const serverString = renderToStaticMarkup(serverApp)
        expect(serverString).toMatchSnapshot()
        expect(serverContext.getState()).toMatchSnapshot()
        // Restore the window and attach the state to the "window" for the client
        global.window = windowTemp
        global.window[STATE_IDENTIFIER] = serverContext.getState()
        return serverString
      })
      .then((serverHTML) => {
        // "Client" side render...
        const clientContext = createContext()
        const clientApp = app(clientContext)
        return (
          withAsyncComponents(clientApp)
            .then(() => {
              const clientRenderWrapper = mount(clientApp)
              expect(clientRenderWrapper).toMatchSnapshot()
              expect(renderToStaticMarkup(clientApp)).toEqual(serverHTML)
              return clientRenderWrapper
            })
            // Now give the client side components time to resolve
            .then(
              clientRenderWrapper =>
                new Promise(resolve => setTimeout(() => resolve(clientRenderWrapper), 100)),
            )
            // Now a full render should have occured on client
            .then(clientRenderWrapper => expect(clientRenderWrapper).toMatchSnapshot())
        )
      })
  })

  it('a component only gets resolved once', () => {
    let resolveCount = 0

    const Foo = createAsyncComponent({
      resolve: () => {
        resolveCount += 1
        return () => <div>foo</div>
      },
    })

    withAsyncComponents(<Foo />).then(({ appWithAsyncComponents }) => {
      mount(appWithAsyncComponents)
      expect(resolveCount).toEqual(1)
      mount(appWithAsyncComponents)
      expect(resolveCount).toEqual(1)
    })
  })
})
