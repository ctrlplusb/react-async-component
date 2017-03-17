> ___NOTE:___ This is an alpha release of the library.  The previous "stable" version is on the `0.x.x` branch.

# react-async-component 📬

Resolve components asynchronously, with support for code splitting and advanced server side rendering use cases.

[![npm](https://img.shields.io/npm/v/react-async-component.svg?style=flat-square)](http://npm.im/react-async-component)
[![MIT License](https://img.shields.io/npm/l/react-async-component.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Travis](https://img.shields.io/travis/ctrlplusb/react-async-component.svg?style=flat-square)](https://travis-ci.org/ctrlplusb/react-async-component)
[![Codecov](https://img.shields.io/codecov/c/github/ctrlplusb/react-async-component.svg?style=flat-square)](https://codecov.io/github/ctrlplusb/react-async-component)

```jsx
const Product = asyncComponent({
  resolve: () => System.import('./AsyncProduct'),
  LoadingComponent: ({ productId }) => <div>Loading {productId}</div>,
  ErrorComponent: ({ error }) => <div>{error.message}</div>
});

<Product productId={1} /> // 🚀
```

## TOCs

  - [Introduction](#introduction)
  - [Features](#features)
  - [Usage](#usage)
  - [API](#api)
    - [asyncComponent(config)](#asynccomponentconfig)
    - [AsyncComponentProvider](#asynccomponentprovider)
    - [createAsyncContext](#createasynccontext)
  - [Server Side Rendering](#server-side-rendering)
  - [FAQs](#faqs)

## Introduction

This library does not require that you use either Webpack or Babel.  Instead it provides you a generic and "pure" Javascript/React API which allows for the expression of lazy-loaded Components.  It's `Promise`-based API naturally allows you to take advantage of modern code splitting APIs (e.g `import()`, `System.import`, `require.ensure`).

## Features

 - Supports _any_ major code splitting API.
 - Show a `LoadingComponent` until your component is resolved.
 - Show an `ErrorComponent` if your component resolution fails.
 - Prevents flash-of-content by tracking already resolved Components.
 - Full server side rendering support, allowing client side state rehydration, avoiding React checksum errors.

## Usage

Firstly, you need to wrap the rendering of your application with the `AsyncComponentProvider`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { AsyncComponentProvider } from 'react-async-component'; // 👈
import MyApp from './components/MyApp';

const app = (
  // 👇
  <AsyncComponentProvider>
    <MyApp />
  </AsyncComponentProvider>
);

ReactDOM.render(app, document.getElementById('app'));
```

Now, let's create an asynchronous `Product` component.  I recommend that you use the following folder/file for your asynchronous components:

```
 |- components
    |- Product
       |- index.js
       |- AsyncProduct.js
```

__`./components/Product/index.js`__:

```js
import { asyncComponent } from 'react-async-component';

// Create async component 👇
export default asyncComponent({
  resolve: () => System.import('./AsyncProduct')
                 // That resolves to 👆
});
```

__`./components/Product/AsyncProduct.js`__

```jsx
import React from 'react';

export default function Product({ productId }) {
  return <div>You are viewing product {productId}</div>;
}
```

Now, you can simply import `Product` anywhere in your application and not have to worry about having to call `createAsyncComponent` again.

For example:

```jsx
import React from 'react';
import Product from './components/Product';

const MyApp = () => (
  <div>
    <h1>Welcome to My App</h1>
    // 👇 Use as "normal"
    <Product productId={1337} />
  </div>
);

export default MyApp;
```

🚀

You have a lot more power than is shown here. Be sure to check out the [`API`](#api) for more.

## API

### `asyncComponent(config)`

The asynchronous component factory. Config goes in, an asynchronous component comes out.

#### Arguments

  - `config` (_Object_) : The configuration object for the async Component. It has the following properties available:
    - `resolve` (_() => Promise<Component>_) : A function that should return a `Promise` that will resolve the Component you wish to be async.
    - `LoadingComponent` (_Component_, Optional, default: `null`) : A Component that will be displayed until your async Component is resolved. All props will be passed to it.
    - `ErrorComponent` (_Component_, Optional, default: `null`) : A Component that will be displayed if any error occurred whilst trying to resolve your component. All props will be passed to it as well as an `error` prop which is an object with a `message` and  `stack` property.
    - `name` (_String_, Optional, default: `'AsyncComponent'`) : Use this if you would like to name the created async Component, which helps when firing up the React Dev Tools for example.
    - `es6Aware` (_Boolean_, Optional, default: `true`) : Especially useful if you are resolving ES2015 modules. The resolved module will be checked to see if it has a `.default` and if so then the value attached to `.default` will be used.
    - `ssrMode` (_Boolean_, Optional, default: `'render'`) : Only applies for server side rendering applications. Please see the documentation on server side rendering. The following values are allowed.
      - __`'render'`__ - Your asynchronous component will be resolved and rendered on the server.  It's children will
      be checked to see if there are any nested asynchronous component instances, which will then be processed based on the `ssrMode` value that was associated with them.
      - __`'defer'`__ - Your asynchronous component will _not_ be rendered on the server, instead deferring rendering to the client/browser.
      - __`'boundary'`__ - Your asynchronous component will be resolved and rendered on the server. However, if it has a nested asynchronous component instance within it's children that component will be ignored and treated as being deferred for rendering in the client/browser instead.
    We highly recommend that you consider using `defer` as much as you can.

#### Returns

A React Component.

#### Examples

##### `LoadingComponent`

```jsx
export default asyncComponent({
  resolve: () => import('./AsyncProduct'),
  LoadingComponent: ({ productId }) => <div>Loading product {productId}</div>
});
```

##### `ErrorComponent`

```jsx
export default asyncComponent({
  resolve: () => import('./AsyncProduct'),
  LoadingComponent: ({ productId }) => <div>Loading product {productId}</div>
});
```

##### Webpack `require.ensure` Code Splitting API

```jsx
export default asyncComponent({
  resolve: () => new Promise(resolve =>
    require.ensure([], (require) => {
      resolve(require('./components/Product'));
    });
  )
});
```

##### Webpack `import` / `System.import` Code Splitting API

Note: `System.import` is considered deprecated and will be replaced with `import`, but for now they can be used interchangeably (you may need a Babel plugin for the `import` syntax).

```jsx
export default asyncComponent({
  resolve: () => System.import('./components/Product')
});
```

### `<AsyncComponentProvider />`

Wraps your application allowing for efficient and effective use of asynchronous components.

#### Props

 - `asyncContext` (_Object_, Optional) : You can optionally provide an asynchronous context (created using `createAsyncContext`).  If you don't provide one then an instance will be created automatically internally.  It can be useful to create and provide your own instance so that you can gain hooks into the context for advanced use cases such as server side rendering state rehydration or hot module replacement interoperability.
 - `rehydrateState` (_Object_, Optional) : Only useful in a server side rendering application (see the docs).  This allows you to provide the state returned by the server to be used to rehydrate the client appropriately, ensuring that it's rendered checksum will match that of the content rendered by the server.

### `createAsyncContext()`

Creates an asynchronous context that can be used by the `<AsyncComponentProvider />`.  The context is an object that exposes the following properties to you:

  - `getState()` (_() => Object_) : A function that when executed gets the current state of the `<AsyncComponentProvider />`. i.e. which async components resolved / failed to resolve etc.  This is especially useful for server sider rendering applications where you need to provide the server rendered state to the client instance in order to ensure the required asynchronous component instances are resolved prior to render.

## Server Side Rendering

This library has been designed for generic interoperability with [`react-async-bootstrapper`](https://github.com/ctrlplusb/react-async-bootstrapper). The `react-async-bootstrapper` allows us to do a "pre-render parse" of a React Element tree and execute any "bootstrapping" process that may be attached to a components within the tree.  In our case the "bootstrapping" process involves the resolution of the asynchronous components so that they can be rendered by the server.  We use this generic library approach as it allows interoperability with other libraries that have "bootstrapping" needs (e.g. data preloading as done by `react-jobs`).

Firstly, install `react-async-bootstrapper`:

```
npm install react-async-bootstrapper
```

Now, let's configure the "server" side.  You could use a similar `express` (or other HTTP server) middleware:

```jsx
import React from 'react';
import { AsyncComponentProvider, createAsyncContext } from 'react-async-component'; // 👈
import asyncBootstrapper from 'react-async-bootstrapper'; // 👈
import { renderToString } from 'react-dom/server';
import serialize from 'serialize-javascript';
import MyApp from './shared/components/MyApp';

export default function expressMiddleware(req, res, next) {
  //    Create the async context for our provider, this grants
  // 👇 us the ability to tap into the state to send back to the client.
  const asyncContext = createAsyncContext();

  // 👇 Ensure you wrap your application with the provider.
  const app = (
    <AsyncComponentProvider asyncContext={asyncContext}>
      <MyApp />
    </AsyncComponentProvider>
  );

  // 👇 This makes sure we "bootstrap" resolve any async components prior to rendering
  asyncBootstrapper(app).then(() => {
      // It's now safe to render 👇
      const appString = renderToString(app);

      // 👇 Get the async component state.
      const asyncState = asyncContext.getState();

      const html = `
        <html>
          <head>
            <title>Example</title>
          </head>
          <body>
            <div id="app">${appString}</div>
            <script type="text/javascript">
              // Serialise the state into the HTML response 👇
              window.ASYNC_COMPONENTS_STATE = ${serialize(asyncState)}
            </script>
          </body>
        </html>`;
      res.send(html);
    });
}
```

Then on the "client" side you would do the following:

```jsx
import React from 'react';
import { render } from 'react-dom';
import { AsyncComponentProvider } from 'react-async-component'; // 👈
import asyncBootstrapper from 'react-async-bootstrapper'; // 👈
import MyApp from './components/MyApp';

// 👇 Get any "rehydrate" state sent back by the server
const rehydrateState = window.ASYNC_COMPONENTS_STATE

//   Ensure you wrap your application with the provider,
// 👇 and pass in the rehydrateState.
const app = (
  <AsyncComponentProvider rehydrateState={rehydrateState}>
    <MyApp />
  </AsyncComponentProvider>
);

//   We run the bootstrapper again, which in this context will
//   ensure that all components specified by the rehydrateState
// 👇 will be resolved prior to render.
asyncBootstrapper(app).then(() => {
  // 👇 Render the app
  render(app, document.getElementById('app'));
});
```

### SSR AsyncComponent Resolution Process

It is worth us highlighting exactly how we go about resolving and rendering your `asyncComponent` instances on the server. This knowledge will help you become aware of potential issues with your component implementations as well as how to effectively use our provided configuration properties to create more efficient implementations.

When running `react-async-bootstrapper` on the server the helper has to walk through your react element tree (depth first i.e. top down) in order to discover all the `asyncComponent` instances and resolve them in preparation for when you call the `ReactDOM.renderToString`. As it walks through the tree it has to call the `componentWillMount` method on your Components and then the `render` methods so that it can get back the child react elements for each Component and continue walking down the element tree. When it discovers an `asyncComponent` instance it will first resolve the Component that it refers to and then it will continue walking down it's child elements (unless you set the configuration for your `asyncComponent` to not allow this) in order to try and discover any nested `asyncComponent` instances.  It continues doing this until it exhausts your element tree.

Although this operation isn't as expensive as an actual render as we don't generate the DOM it can still be quite wasteful if you have a deep tree.  Therefore we have provided a set of configuration values that allow you to massively optimise this process. See the next section below.

### SSR Performance Optimisation

As discussed in the ["SSR AsyncComponent Resolution Process"](#ssr-asyncComponent-resolution-process) section above it is possible to have an inefficient implementation of your `asyncComponent` instances.  Therefore we introduced a new configuration object property for the `asyncComponent` factory, called `ssrMode`, which provides you with a mechanism to optimise the configuration of your async Component instances.  Please see the API documentation for more information.

Understand your own applications needs and use the options appropriately . I personally recommend using mostly "defer" and a bit of "boundary". Try to see code splitting as allowing you to server side render an application shell to give the user perceived performance. Of course there will be requirements otherwise (SEO), but try to isolate these components and use a "boundary" as soon as you feel you can.

## Demo

You can see a "live" version [here](https://react-universally.now.sh/). This is a deployment of the "next" branch of ["React, Universally"](https://github.com/ctrlplusb/react-universally). Open the network tab and then click the menu items to see the asynchronous component resolving in action.

## FAQs

> Let me know if you have any...
