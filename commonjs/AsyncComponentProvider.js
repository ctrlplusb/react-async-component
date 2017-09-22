'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _createAsyncContext = require('./createAsyncContext');

var _createAsyncContext2 = _interopRequireDefault(_createAsyncContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AsyncComponentProvider = function (_React$Component) {
  _inherits(AsyncComponentProvider, _React$Component);

  function AsyncComponentProvider() {
    _classCallCheck(this, AsyncComponentProvider);

    return _possibleConstructorReturn(this, (AsyncComponentProvider.__proto__ || Object.getPrototypeOf(AsyncComponentProvider)).apply(this, arguments));
  }

  _createClass(AsyncComponentProvider, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.asyncContext = this.props.asyncContext || (0, _createAsyncContext2.default)();
      this.rehydrateState = this.props.rehydrateState;
    }
  }, {
    key: 'getChildContext',
    value: function getChildContext() {
      var _this2 = this;

      return {
        asyncComponents: {
          getNextId: this.asyncContext.getNextId,
          resolved: this.asyncContext.resolved,
          shouldRehydrate: function shouldRehydrate(id) {
            var resolved = _this2.rehydrateState.resolved[id];
            delete _this2.rehydrateState.resolved[id];
            return resolved;
          }
        }
      };
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.Children.only(this.props.children);
    }
  }]);

  return AsyncComponentProvider;
}(_react2.default.Component);

AsyncComponentProvider.propTypes = {
  children: _propTypes2.default.node.isRequired,
  asyncContext: _propTypes2.default.shape({
    getNextId: _propTypes2.default.func.isRequired,
    resolved: _propTypes2.default.func.isRequired,
    getState: _propTypes2.default.func.isRequired
  }),
  rehydrateState: _propTypes2.default.shape({
    resolved: _propTypes2.default.object
  })
};

AsyncComponentProvider.defaultProps = {
  asyncContext: undefined,
  rehydrateState: {
    resolved: {}
  }
};

AsyncComponentProvider.childContextTypes = {
  asyncComponents: _propTypes2.default.shape({
    getNextId: _propTypes2.default.func.isRequired,
    resolved: _propTypes2.default.func.isRequired,
    shouldRehydrate: _propTypes2.default.func.isRequired
  }).isRequired
};

exports.default = AsyncComponentProvider;