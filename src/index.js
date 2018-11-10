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
		require('child_process').execSync(process.platform === 'win32' ? 'node_modules\\.bin\\tsc.cmd' : 'node_modules/.bin/tsc');
		transform = async (code, id) => {
			if (id.endsWith('.ts')) {
				id = id.slice(0, -2) + 'js';
				const [js, map] = await Promise.all(
					[id, id + '.map'].map(async path => {
						const data = await readFileAsync(path);
						fs.unlink(path, () => {});
						return data.toString();
					}),
				);
				return { code: js, map: JSON.parse(map) };
			}
		};
	}

	return {
		resolveId(importee, importer) {
			if (/\/[^.]+$/.test(importee)) {
				return this.resolveId(importee + '.ts', importer);
			}
		},
		transform,
	};
};
