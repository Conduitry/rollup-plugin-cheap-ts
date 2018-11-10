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

You must have a `tsconfig.json` in the same directory as your `rollup.config.js`. This file must specify an `"include": []` array, as this is used when calling the `tsc` binary so it knows which `.ts` files to compile.

All extensionless imports must be TypeScript files.

## License

Copyright (c) 2018 Conduitry

- [MIT](LICENSE)
