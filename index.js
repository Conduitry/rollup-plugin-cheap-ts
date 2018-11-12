'use strict';

const fs = require('fs');
const path = require('path');

let tsconfig;
const files = new Set();

module.exports = () => {
	if (!tsconfig) {
		tsconfig = JSON.parse(fs.readFileSync('tsconfig.json').toString());
		const { compilerOptions } = tsconfig;
		if (!compilerOptions || !compilerOptions.target || compilerOptions.target.toLowerCase() === 'es3' || compilerOptions.target.toLowerCase() === 'es5') {
			throw new Error('tsconfig.json must specify "compilerOptions"."target" of at least "ES6"');
		}
		['inlineSourceMap', 'module', 'noEmit', 'outDir', 'outFile'].forEach(key => {
			if (compilerOptions[key]) {
				throw new Error(`tsconfig.json must not specify "compilerOptions"."${key}"`);
			}
		});
		if (process.env.ROLLUP_WATCH !== 'true') {
			require('child_process').execSync('tsc', { stdio: ['ignore', 'inherit', 'inherit'] });
			const unlinkQuiet = file => {
				try {
					fs.unlinkSync(file);
				} catch (e) {}
			};
			process.on('exit', () => files.forEach(unlinkQuiet));
		}
	}

	let transform;
	if (process.env.ROLLUP_WATCH === 'true') {
		const { transpileModule } = require('typescript');
		transform = (code, id) => {
			if (id.endsWith('.ts')) {
				const { outputText, sourceMapText } = transpileModule(code, tsconfig);
				return { code: outputText, map: JSON.parse(sourceMapText) };
			}
		};
	} else {
		const readFileAsync = require('util').promisify(fs.readFile);
		transform = async (code, id) => {
			if (id.endsWith('.ts')) {
				const jsPromise = readFileAsync(id.slice(0, -2) + 'js').then(data => data.toString());
				const mapPromise = readFileAsync(id.slice(0, -2) + 'js.map').then(data => JSON.parse(data.toString()), () => null);
				const [code, map] = await Promise.all([jsPromise, mapPromise]);
				files.add(id.slice(0, -2) + 'js');
				files.add(id.slice(0, -2) + 'js.map');
				return { code, map };
			}
		};
	}

	return {
		name: 'cheap-ts',
		resolveId(importee, importer) {
			if ((!importer || importer.endsWith('.ts')) && !path.extname(importee)) {
				return this.resolveId(importee + '.ts', importer);
			}
		},
		transform,
	};
};
