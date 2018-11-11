# rollup-plugin-cheap-ts

A hacky lightweight Rollup plugin for transpiling and bundling libraries written in TypeScript.

## Installation

This is not published to npm. Install from Git tags.

## Usage

Include the plugin in your `rollup.config.js`:

```javascript
import cheapTS from 'rollup-plugin-cheap-ts';

export default {
	// ...
	plugins: [
		// ...
		cheapTS(),
		// ...
	],
};
```

You must have a `tsconfig.json` in the same directory as your `rollup.config.js`. This must specify a `"compilerOptions"."target"` of at least `"ES6"`. There are a few other options that must not be specified. (The plugin will check for these.) All extensionless imports from `.ts` files must refer to `.ts` files.

## License

Copyright (c) 2018 Conduitry

- [MIT](LICENSE)
