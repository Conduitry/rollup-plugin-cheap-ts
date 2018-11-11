export default () => {
	const fs = require('fs');
	const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json').toString());
	if (!tsconfig.include) {
		throw new Error('tsconfig.json must specify "include" configuration');
	}
	if (!tsconfig.compilerOptions) {
		throw new Error('tsconfig.json must specify "compilerOptions" configuration');
	}
	const target = tsconfig.compilerOptions.target && tsconfig.compilerOptions.target.toLowerCase();
	if (!target || target === 'es3' || target === 'es5') {
		throw new Error('tsconfig.json must specify "compilerOptions.target" of at least ES6');
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
		require('child_process').execSync('tsc');
		transform = async (code, id) => {
			if (id.endsWith('.ts')) {
				const jsPromise = readFileAsync(id.slice(0, -2) + 'js').then(data => data.toString());
				const mapPromise = readFileAsync(id.slice(0, -2) + 'js.map').then(data => JSON.parse(data.toString()), () => null);
				const [code, map] = await Promise.all([jsPromise, mapPromise]);
				fs.unlink(id.slice(0, -2) + 'js', () => null);
				fs.unlink(id.slice(0, -2) + 'js.map', () => null);
				return { code, map };
			}
		};
	}

	const path = require('path');
	return {
		resolveId(importee, importer) {
			if (!path.extname(importee)) {
				return this.resolveId(importee + '.ts', importer);
			}
		},
		transform,
	};
};
