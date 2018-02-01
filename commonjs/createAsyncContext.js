"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createAsyncContext;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function createAsyncContext() {
  var registry = {};
  return {
    resolved: function resolved(chunkName) {
      registry[chunkName] = true;
    },
    getState: function getState() {
      return {
        resolved: Object.keys(registry).reduce(function (acc, cur) {
          return Object.assign(acc, _defineProperty({}, cur, true));
        }, {})
      };
    }
  };
}