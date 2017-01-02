/* @flow */

import sinon from 'sinon';

export default function describeComponent(desc : string, body : Function) {
  describe(desc, () => {
    // Since react will console.error propType warnings, that which we'd rather have
    // as errors, we use sinon.js to stub it into throwing these warning as errors
    // instead.
    beforeAll(() => {
      sinon.stub(console, 'error', (warning) => { throw new Error(warning); });
    });

    // While not forgetting to restore it afterwards
    afterAll(() => { console.error.restore(); });

    body();
  });
}
