/* @flow */

import webpackConfigFactory from './configFactory'

module.exports = function umdMinConfigFactory(options : Object, args : Object = {}) {
  return webpackConfigFactory({ target: 'umd-min' }, args)
}
