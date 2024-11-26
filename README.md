# eslint-plugin-no-browser-globals

An ESLint plugin that disallows the use of browser globals. It is useful when you want to make sure that your code is not using browser globals, which can cause issues when running in a non-browser environment.

## Installation

```bash
npm install eslint-plugin-no-browser-globals --save-dev

# or

yarn add eslint-plugin-no-browser-globals --dev

# or

pnpm add eslint-plugin-no-browser-globals --save-dev
```

And then add `no-browser-globals` to the plugins section of your `.eslintrc` configuration file:

```json
{
  "plugins": ["no-browser-globals"],
  "rules": {
    "no-browser-globals/no-ssr-browser-globals": ["error"]
  }
}
```

# Usage

This plugin **ONLY** works in `jsx/tsx` files.

This plugin **ONLY** works in `jsx/tsx` files.

This plugin **ONLY** works in `jsx/tsx` files.

## Using browser globals inside hooks

Use browser globals directly is not allowed. But you can use them inside a hook like `useEffect` or `useLayoutEffect`.

````js

### Not Allowed

```js
const foo = location.href;
````

### Allowed

```js
useEffect(() => {
  const foo = location.href;

  // Do something with foo...
}, []);
```

> You can also specify the hooks that are allowed to use browser globals, default is `useEffect` and `useLayoutEffect`.
> Here is a configuration example that allows the use of browser globals inside `useEffect` , `useLayoutEffect` and 'useCustomHook'.

```json
{
  "plugins": ["no-browser-globals"],
  "rules": {
    "no-browser-globals/no-ssr-browser-globals": [
      "error",
      { "allowedHooks": ["useEffect", "useLayoutEffect", "useCustomHook"] }
    ]
  }
}
```

## Using browser globals inside event handlers

You can use browser globals inside a `on[A-Z]*` event handler.

### Not Allowed

```js
const App = () => {
  return (
    <button
      onclick={() => {
        const value = location.host;
      }}
    />
  );
};
```

### Allowed

```js
const App = () => {
  return (
    <button
      onClick={() => {
        const value = location.host;
      }}
    />
  );
};
```

## Using browser globals inside specific function callbacks

**Note:** Only callbacks that are passed to specific functions are allowed to use browser globals. Use browser globals directly is not allowed.

### Not Allowed

```js
const foo = () => {
  const value = location.host;
};
```

### Allowed

```js
setTimeout(() => {
  const value = location.host;
}, 1000);
```

> You can also specify the functions that are allowed to use browser globals, default is `setTimeout`, `setInterval`.
> Here is a configuration example that allows the use of browser globals inside `setTimeout` , `setInterval` and 'customFunction'.

```json
{
  "plugins": ["no-browser-globals"],
  "rules": {
    "no-browser-globals/no-ssr-browser-globals": [
      "error",
      { "allowedFunctions": ["setTimeout", "setInterval", "customFunction"] }
    ]
  }
}
```

```js
const specialFunction = (fn) => {
  return fn();
};

// Use browser globals inside the callback in specialFunction, allowed.
specialFunction(() => {
  const value = location.host;
});
```

## Using browser globals inside `window !== undefined` check

You can use browser globals inside a `window !== undefined` check.

### Not Allowed

```js
if (location) {
  const value = location.host;
  // Do something with value...
}
```

### Allowed

```js
if (window !== undefined) {
  const value = location.host;
  // Do something with value...
}
```

> This logic is only check if the use of browser globals is inside a `window !== undefined` check, simple but works in most cases. If you have a complex check, use @client instead.

> Only works if `conditionCheck` is `true`.(Default is `true` so you don't need to specify it if you want to use this feature)

```json
{
  "plugins": ["no-browser-globals"],
  "rules": {
    "no-browser-globals/no-ssr-browser-globals": ["error", { "conditionCheck": true }]
  }
}
```

## @client annotation

You can use the `@client` annotation to specify that the use of browser globals is allowed in a specific line of code.

### Not Allowed

```js
const value = location.host; // Error: Do not use browser globals directly.
```

### Allowed

```js
// @client
const value = location.host; // No error
```

# Configuration

```json
{
  "allowedGlobals": {
    "type": "array",
    "items": { "type": "string" },
    "default": []
  },
  "allowedHooks": {
    "type": "array",
    "items": { "type": "string" },
    "default": ["useEffect", "useLayoutEffect"]
  },
  "allowedFunctions": {
    "type": "array",
    "items": { "type": "string" },
    "default": ["setTimeout", "setInterval"]
  },
  "conditionCheck": { "type": "boolean", "default": true }
}
```

| Option           | Description                                                                        | Default value                      |
| ---------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| allowedGlobals   | An array of global variables that are allowed to use.                              | `[]`                               |
| allowedHooks     | An array of hooks that are allowed to use browser globals inside.                  | `["useEffect", "useLayoutEffect"]` |
| allowedFunctions | An array of functions that are allowed to use browser globals inside its callback. | `["setTimeout", "setInterval"]`    |
| conditionCheck   | You can use browser globals inside a `window !== undefined` check if it is `true`. | `true`                             |
