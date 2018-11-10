const fs = require('fs');

export default () => {
	let transform;

	if (process.env.ROLLUP_WATCH === 'true') {
		const { transpileModule } = require('typescript');
		const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json').toString());
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
