/* @flow */

import webpackConfigFactory from './configFactory'

module.exports = function umdConfigFactory(options : Object, args : Object = {}) {
  return webpackConfigFactory({ target: 'umd' }, args)
}
