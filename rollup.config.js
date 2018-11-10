export default {
	input: './src/index.js',
	external: name => /^[@a-z]/.test(name),
	output: [{ file: './dist/index.js', format: 'cjs', sourcemap: true, interop: false }],
};
