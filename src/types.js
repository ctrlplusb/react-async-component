/* @flow */

// eslint-disable-next-line import/no-extraneous-dependencies
import { Element } from 'react';

export type React$Element = Element<*>;

export type ExecContext = {
  registerComponent : (number, Function) => void,
  getComponent : (number) => ?Function,
  getResolved : () => { [key : number] : true },
}

export type ProviderChildContext = {
  asyncComponents: {
    nextId : () => number,
    getComponent : (number) => ?Function,
  }
};
