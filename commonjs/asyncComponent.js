'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var validSSRModes = ['resolve', 'defer', 'boundary'];

function asyncComponent(config) {
  var name = config.name,
      resolve = config.resolve,
      _config$autoResolveES = config.autoResolveES2015Default,
      autoResolveES2015Default = _config$autoResolveES === undefined ? true : _config$autoResolveES,
      _config$serverMode = config.serverMode,
      serverMode = _config$serverMode === undefined ? 'resolve' : _config$serverMode,
      LoadingComponent = config.LoadingComponent,
      ErrorComponent = config.ErrorComponent;


  if (validSSRModes.indexOf(serverMode) === -1) {
    throw new Error('Invalid serverMode provided to asyncComponent');
  }

  var env = ['node', 'browser'].indexOf(config.env) > -1 ? config.env : typeof window === 'undefined' ? 'node' : 'browser';

  var sharedState = {
    // A unique id we will assign to our async component which is especially
    // useful when rehydrating server side rendered async components.
    id: null,
    // This will be use to hold the resolved module allowing sharing across
    // instances.
    // NOTE: When using React Hot Loader this reference will become null.
    module: null,
    // If an error occurred during a resolution it will be stored here.
    error: null,
    // Allows us to share the resolver promise across instances.
    resolver: null

    // Takes the given module and if it has a ".default" the ".default" will
    // be returned. i.e. handy when you could be dealing with es6 imports.
  };var es6Resolve = function es6Resolve(x) {
    return autoResolveES2015Default && x != null && (typeof x === 'function' || (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object') && x.default ? x.default : x;
  };

  var getResolver = function getResolver() {
    if (sharedState.resolver == null) {
      try {
        // Wrap whatever the user returns in Promise.resolve to ensure a Promise
        // is always returned.
        var resolver = resolve();
        sharedState.resolver = Promise.resolve(resolver);
      } catch (err) {
        sharedState.resolver = Promise.reject(err);
      }
    }
    return sharedState.resolver;
  };

  var AsyncComponent = function (_React$Component) {
    _inherits(AsyncComponent, _React$Component);

    function AsyncComponent(props, context) {
      _classCallCheck(this, AsyncComponent);

      // We have to set the id in the constructor because a RHL seems
      // to recycle the module and therefore the id closure will be null.
      // We can't put it in componentWillMount as RHL hot swaps the new code
      // so the mount call will not happen (but the ctor does).
      var _this = _possibleConstructorReturn(this, (AsyncComponent.__proto__ || Object.getPrototypeOf(AsyncComponent)).call(this, props, context));

      if (_this.context.asyncComponents != null && !sharedState.id) {
        sharedState.id = _this.context.asyncComponents.getNextId();
      }
      return _this;
    }

    // @see react-async-bootstrapper


    _createClass(AsyncComponent, [{
      key: 'asyncBootstrap',
      value: function asyncBootstrap() {
        var _this2 = this;

        var _context = this.context,
            asyncComponents = _context.asyncComponents,
            asyncComponentsAncestor = _context.asyncComponentsAncestor;
        var shouldRehydrate = asyncComponents.shouldRehydrate;


        var doResolve = function doResolve() {
          return _this2.resolveModule().then(function (module) {
            return module !== undefined;
          });
        };

        if (env === 'browser') {
          return shouldRehydrate(sharedState.id) ? doResolve() : false;
        }

        // node
        var isChildOfBoundary = asyncComponentsAncestor != null && asyncComponentsAncestor.isBoundary;
        return serverMode === 'defer' || isChildOfBoundary ? false : doResolve();
      }
    }, {
      key: 'getChildContext',
      value: function getChildContext() {
        if (this.context.asyncComponents == null) {
          return {
            asyncComponentsAncestor: null
          };
        }

        return {
          asyncComponentsAncestor: {
            isBoundary: serverMode === 'boundary'
          }
        };
      }
    }, {
      key: 'componentWillMount',
      value: function componentWillMount() {
        this.setState({
          module: sharedState.module
        });
        if (sharedState.error) {
          this.registerErrorState(sharedState.error);
        }
      }
    }, {
      key: 'componentDidMount',
      value: function componentDidMount() {
        if (this.shouldResolve()) {
          this.resolveModule();
        }
      }
    }, {
      key: 'shouldResolve',
      value: function shouldResolve() {
        return sharedState.module == null && sharedState.error == null && !this.resolving && typeof window !== 'undefined';
      }
    }, {
      key: 'resolveModule',
      value: function resolveModule() {
        var _this3 = this;

        this.resolving = true;

        return getResolver().then(function (module) {
          if (_this3.unmounted) {
            return undefined;
          }
          if (_this3.context.asyncComponents != null) {
            _this3.context.asyncComponents.resolved(sharedState.id);
          }
          sharedState.module = module;
          if (env === 'browser') {
            _this3.setState({
              module: module
            });
          }
          _this3.resolving = false;
          return module;
        }).catch(function (error) {
          if (_this3.unmounted) {
            return undefined;
          }
          if (env === 'node' || env === 'browser' && !ErrorComponent) {
            // We will at least log the error so that user isn't completely
            // unaware of an error occurring.
            // eslint-disable-next-line no-console
            console.warn('Failed to resolve asyncComponent');
            // eslint-disable-next-line no-console
            console.warn(error);
          }
          sharedState.error = error;
          _this3.registerErrorState(error);
          _this3.resolving = false;
          return undefined;
        });
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        this.unmounted = true;
      }
    }, {
      key: 'registerErrorState',
      value: function registerErrorState(error) {
        var _this4 = this;

        if (env === 'browser') {
          setTimeout(function () {
            if (!_this4.unmounted) {
              _this4.setState({
                error: error
              });
            }
          }, 16);
        }
      }
    }, {
      key: 'render',
      value: function render() {
        var _state = this.state,
            module = _state.module,
            error = _state.error;

        if (error) {
          return ErrorComponent ? _react2.default.createElement(ErrorComponent, _extends({}, this.props, { error: error })) : null;
        }

        // This is as workaround for React Hot Loader support.  When using
        // RHL the local component reference will be killed by any change
        // to the component, this will be our signal to know that we need to
        // re-resolve it.
        if (this.shouldResolve()) {
          this.resolveModule();
        }

        var Component = es6Resolve(module);
        return Component ? _react2.default.createElement(Component, this.props) : LoadingComponent ? _react2.default.createElement(LoadingComponent, this.props) : null;
      }
    }]);

    return AsyncComponent;
  }(_react2.default.Component);

  AsyncComponent.displayName = name || 'AsyncComponent';

  AsyncComponent.contextTypes = {
    asyncComponentsAncestor: _propTypes2.default.shape({
      isBoundary: _propTypes2.default.bool
    }),
    asyncComponents: _propTypes2.default.shape({
      getNextId: _propTypes2.default.func.isRequired,
      resolved: _propTypes2.default.func.isRequired,
      shouldRehydrate: _propTypes2.default.func.isRequired
    })
  };

  AsyncComponent.childContextTypes = {
    asyncComponentsAncestor: _propTypes2.default.shape({
      isBoundary: _propTypes2.default.bool
    })
  };

  return AsyncComponent;
}

exports.default = asyncComponent;