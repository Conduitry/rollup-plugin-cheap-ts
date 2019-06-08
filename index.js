'use strict';

const is_watch = process.env.ROLLUP_WATCH === 'true';

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const typescript = is_watch && require('typescript');

let tsconfig;
const files = new Set();
const readFile_async = (...args) => new Promise((res, rej) => fs.readFile(...args, (err, data) => err ? rej(err) : res(data)));
function resolveId(importee, importer) {
	if ((!importer || importer.endsWith('.ts')) && !path.extname(importee)) {
		return this.resolveId(importee + '.ts', importer);
	}
}
const transform = is_watch
	? (code, id) => {
		if (id.endsWith('.ts')) {
			const { outputText, sourceMapText } = typescript.transpileModule(code, tsconfig);
			return { code: outputText, map: JSON.parse(sourceMapText) };
		}
	}
	: (code, id) => {
		if (id.endsWith('.ts')) {
			files.add(id.slice(0, -2) + 'js');
			files.add(id.slice(0, -2) + 'js.map');
			return Promise.all([readFile_async(id.slice(0, -2) + 'js').then(data => data.toString()), readFile_async(id.slice(0, -2) + 'js.map').then(data => JSON.parse(data.toString()), () => null)]).then(([code, map]) => ({ code, map }));
		}
	};
const unlink_quiet = file => {
	try {
		fs.unlinkSync(file);
	} catch (e) {}
};

module.exports = () => {
	if (!tsconfig) {
		tsconfig = JSON.parse(fs.readFileSync('tsconfig.json').toString());
		const { compilerOptions } = tsconfig;
		if (!compilerOptions || !compilerOptions.target || compilerOptions.target.toLowerCase() === 'es3' || compilerOptions.target.toLowerCase() === 'es5') {
			throw new Error('tsconfig.json must specify "compilerOptions"."target" of at least "ES6"');
		}
		for (const key of ['inlineSourceMap', 'module', 'noEmit', 'outDir', 'outFile']) {
			if (compilerOptions[key]) {
				throw new Error(`tsconfig.json must not specify "compilerOptions"."${key}"`);
			}
		}
		if (!is_watch) {
			child_process.execSync('tsc', { stdio: ['ignore', 'inherit', 'inherit'] });
			process.on('exit', () => files.forEach(unlink_quiet));
		}
	}

	return { name: 'cheap-ts', resolveId, transform };
};
