import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'

import createAsyncComponent from '../createAsyncComponent'

describe('createAsyncComponent', () => {
  const contextStub = {
    asyncComponents: {
      getNextId: () => 1,
      getComponent: () => undefined,
      registerComponent: () => undefined,
    },
  }

  it('should handle unmounting ensuring that resolved promises do not call setState', () => {
    const resolveDelay = 10
    const Bob = createAsyncComponent({
      resolve: () => new Promise(resolve =>
        setTimeout(
          () => resolve(() => <div>bob</div>),
          resolveDelay,
        ),
      ),
    })
    const setStateSpy = sinon.spy(Bob.prototype, 'setState')
    const renderWrapper = mount(<Bob />, { context: contextStub })
    expect(setStateSpy.callCount).toEqual(0)
    renderWrapper.unmount()
    return new Promise(resolve => setTimeout(resolve, resolveDelay + 2))
      .then(() => expect(setStateSpy.callCount).toEqual(0))
  })
})
