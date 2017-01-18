# react-async-component 😴

Create Components that resolve asynchronously, with support for server side rendering and code splitting.

[![npm](https://img.shields.io/npm/v/react-async-component.svg?style=flat-square)](http://npm.im/react-async-component)
[![MIT License](https://img.shields.io/npm/l/react-async-component.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Travis](https://img.shields.io/travis/ctrlplusb/react-async-component.svg?style=flat-square)](https://travis-ci.org/ctrlplusb/react-async-component)
[![Codecov](https://img.shields.io/codecov/c/github/ctrlplusb/react-async-component.svg?style=flat-square)](https://codecov.io/github/ctrlplusb/react-async-component)

```jsx
const AsyncProduct = createAsyncComponent({
  resolve: () => import('./components/Product'))
});

<AsyncProduct productId={1} /> // 🚀
```

## TOCs

  - [Introduction](#introduction)
  - [Usage](#usage)
  - [API](#api)
  - [Caveats](#caveats)
  - [FAQs](#faqs)

## Introduction

This library is an evolution of [`code-split-component`](). Unlike `code-split-component` this library does not require that you use either Webpack or Babel.  Instead it provides you a pure Javascript/React API which has been adapted in a manner to make it generically useful for lazy-loaded Components, with support for modern code splitting APIs (e.g `import()`, `System.import`, `require.ensure`).

## Usage

Firstly, you need to use our helper to allow your application to use asynchronous components in an efficient manner.

```jsx
import { withAsyncComponents } from 'react-async-component'; // 👈

// Declare your application as normal.
const app = <MyApp />;

// Then provide it to our helper, which returns a Promise.
//                  👇
withAsyncComponents(app).then((result) => {
//                               👆 it resolves a "result" object
  const {
    // ❗️ We return a new version of your app that supports
    //    asynchronous components. 💪
    appWithAsyncComponents
  } = result;

  // 🚀 render it!
  ReactDOM.render(appWithAsyncComponents, document.getElementById('app'));
});
```

Next up, let's make an asynchronous Component!  We provide another helper for this.

```jsx
import { createAsyncComponent } from 'react-async-component'; // 👈

const AsyncProduct = createAsyncComponent({
  // Provide a function that will return a Promise that resolves
  // as your Component.
  resolve: function resolveComponent() {
    return new Promise(function (resolve) {
      // The Promise the resolves with a simple require of the
      // `Product` Component.
      resolve(require('./components/Product'));
    });
  }
});

// You can now use the created Component as though it were a
// "normal" Component, providing it props that will be given
// to the resolved Component.
const x = <Product productId={10} />
```

The above may look a tad bit verbose.  If you are a fan of anonymous functions then we could provide a more terse implementation:

```jsx
const AsyncProduct = createAsyncComponent({
  resolve: () => new Promise(resolve =>
    resolve(require('./components/Product'))
  )
});
```

Okay, the above may not look terribly useful at first, but it opens up an easy point to integrating code splitting APIs supported by bundlers such as Webpack. We will provide examples of these as well as details on some other useful configuration options within the [`API`](#api) section.

## API

### `createAsyncComponent(config)`

Our async Component factory. Config goes in, an async Component comes out.

#### Arguments

  - `config` : _Object_
    The configuration object for the async Component. It has the following properties available:
    - `resolve` : _Function => Promise<Component>_
      A function that should return a `Promise` that will resolve the Component you wish to be async.
    - `defer` : _Boolean_ (Optional, default: false)
      Only useful for server side rendering applications. If this is set to true then the async component will only be resolved on the client/browser, not the server. I _highly_ recommend that you consider using this value as much as you can.  Try to relieve the load on your server and use server side rendering to provide an application shell for your users.  They will still get a perceived performance benefit.
    - `Loading` : _Component_ (Optional, default: null)
      A Component to be displayed whilst your async Component is being resolved. It will be provided the same props that will be provided to your resovled async Component.
    - `es6Aware` : _Boolean_ (Optional, default: true)
      If you are using ES2015 modules with default exports (i.e `export default MyComponent`) then you may need your Component resolver to do syntax such as `require('./MyComp').default`. Forgetting the `.default` can cause havoc with hard to debug error messages. To cover your back we will automatically try to resolve a `.default` on the result that is resolved by your Component. If the `.default` exists it will be used, else we will use the original result.

#### Returns

A React Component.

#### Examples

##### Simple

```jsx
const AsyncProduct = createAsyncComponent({
  resolve: () => new Promise(resolve =>
    resolve(require('./components/Product'))
  )
});

<AsyncProduct productId={1} />
```

##### With Loading Component

```jsx
const AsyncProduct = createAsyncComponent({
  resolve: () => new Promise(resolve =>
    resolve(require('./components/Product'))
  ),
  Loading: ({ productId }) => <div>Loading product {productId}</div>
});

<AsyncProduct productId={1} />
```

##### Webpack 1/2 `require.ensure` Code Splitting

```jsx
const AsyncProduct = createAsyncComponent({
  resolve: () => new Promise(resolve =>
    require.ensure([], (require) => {
      resolve(require('./components/Product'));
    });
  )
});

<AsyncProduct productId={1} />
```

##### Webpack 2 `import` / `System.import` Code Splitting

Note: `System.import` is considered deprecated and will be replaced with `import`, but for now they can be used interchangeably (you may need a Babel plugin for the `import` syntax).

```jsx
const AsyncProduct = createAsyncComponent({
  resolve: () => System.import('./components/Product')
});

<AsyncProduct productId={1} />
```

#### Defer Loading to the Client/Browser

i.e. The component won't be resolved and rendered in a server side rendering execution.

```jsx
const AsyncProduct = createAsyncComponent({
  resolve: () => System.import('./components/Product'),
  defer: true
});
```

### `withAsyncComponents(element)`

Decorates your application with the ability to use async Components in an efficient manner. It also manages state storing/rehydrating for server side rendering applications.

### Arguments

 - `app` _React.Element_
   The react element representing your application.

### Returns

A promise that resolves in a `result` object.  The `result` object will have the following properties available:

  - `appWithAsyncComponents` _React.Element_
    Your application imbued with the ability to use async Components. ❗️Use this when rendering your app.
  - `state` _Object_
    Only used on the "server" side of server side rendering applications. It represents the state of your async Components (i.e. which ones were rendered) so that the server can feed this information back to the client/browser.
  - `STATE_IDENTIFIER` _String_
    Only used on the "server" side of server side rendering applications. The identifier of the property you should bind the `state` object to on the `window` object.

### Examples

#### Usage

```jsx
import React from 'react';
import { render } from 'react-dom';
import { withAsyncComponents } from 'react-async-component'; // 👈
import MyApp from './shared/components/MyApp';

const app = <MyApp />

// 👇 run helper on your app.
withAsyncComponents(app)
  //        👇 and you get back a result object.
  .then((result) => {
    const {
      // ❗️ The result includes a decorated version of your app
      // that will allow your application to use async components
      // in an efficient manner.
      appWithAsyncComponents
    } = result;

    // Now you can render the app.
    render(appWithAsyncComponents, document.getElementById('app'));
  });
```

#### Server Side Rendering Usage

When using this helper on the "server" side of your server side rendering applications you should do the following.

> Note: on the "client" side of a server side rendering application you can use the helper in the "nomral" fashion as detailed in the previous example.

```js
import React from 'react';
import { withAsyncComponents } from 'react-async-component'; // 👈
import { renderToString } from 'react-dom/server';
import serialize from 'serialize-javascript';
import MyApp from './shared/components/MyApp';

export default function expressMiddleware(req, res, next) {
  const app = <MyApp />;

  // 👇 run helper on your app.
  withAsyncComponents(app)
    //        👇 and you get back a result object.
    .then((result) => {
      const {
        // ❗️ The result includes a decorated version of your app
        // that will have the async components initialised for
        // the renderToString call.
        appWithAsyncComponents,
        // This state object represents the async components that
        // were rendered by the server. We will need to send
        // this back to the client, attaching it to the window
        // object so that the client can rehydrate the application
        // to the expected state and avoid React checksum issues.
        state,
        // This is the identifier you should use when attaching
        // the state to the "window" object.
        STATE_IDENTIFIER
      } = result;

      const appString = renderToString(appWithAsyncComponents);
      const html = `
        <html>
          <head>
            <title>Example</title>
          </head>
          <body>
            <div id="app">${appString}</div>
            <script type="text/javascript">
              window.${STATE_IDENTIFIER} = ${serialize(state)}
            </script>
          </body>
        </html>`;
      res.send(html);
    });
}
```

## Caveats

At the moment there is one known caveat in using this library: it doesn't support React Hot Loader (RHL). You can still use Webpack's standard Hot Module Replacement, however, RHL does not respond nicely to the architecture of `react-async-component`.

TODO: I'll post up some details why and perhaps we could work to find a solution.

## FAQs

> Let me know if you have any...
