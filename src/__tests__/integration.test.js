/* @flow */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { mount } from 'enzyme';
import { createAsyncComponent, withAsyncComponents } from '../';
import { STATE_IDENTIFIER } from '../constants';

function Bob({ children }) {
  return (
    <div>
      <h1>bob</h1>
      {children}
    </div>
  );
}
Bob.propTypes = { children: React.PropTypes.node };
Bob.defaultProps = { children: null };

const AsyncBob = createAsyncComponent({
  resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
  name: 'AsyncBob',
});

const AsyncBobTwo = createAsyncComponent({
  resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
  name: 'AsyncBobTwo',
});

const DeferredAsyncBob = createAsyncComponent({
  resolve: () => new Promise(resolve => setTimeout(() => resolve(Bob), 10)),
  defer: true,
  name: 'DeferredAsyncBob',
});

const app = (
  <AsyncBob>
    <div>
      <AsyncBobTwo>
        <span>Hello</span>
      </AsyncBobTwo>
      <DeferredAsyncBob>
        <span>World!</span>
      </DeferredAsyncBob>
    </div>
  </AsyncBob>
);

describe('integration', () => {
  afterEach(() => {
    delete global.window[STATE_IDENTIFIER];
  });

  it('works', () =>
    // "Server" side render...
    withAsyncComponents(app)
      .then(({ appWithAsyncComponents, state, STATE_IDENTIFIER: STATE_ID }) => {
        expect(mount(appWithAsyncComponents)).toMatchSnapshot();
        // Attach the state to the "window" for the client
        global.window[STATE_ID] = state;
        return renderToString(appWithAsyncComponents);
      })
      .then(serverHTML =>
        // "Client" side render...
        withAsyncComponents(app)
          .then(({ appWithAsyncComponents }) => {
            expect(mount(appWithAsyncComponents)).toMatchSnapshot();
            expect(renderToString(appWithAsyncComponents)).toEqual(serverHTML);
          }),
      ),
  );
});
