import path from 'node:path';
import os from 'node:os';

export interface FactorioSettings {
	binary: string;
	dataDir: string;
	scriptOutput: string;
	verbose: boolean;
}

export function resolveSettings(): FactorioSettings {
	const binary =
		process.env.FACTORIO_BINARY ??
		path.join(os.homedir(), '.local/share/Steam/steamapps/common/Factorio/bin/x64/factorio');
	const dataDir = process.env.FACTORIO_DATADIR ?? path.join(os.homedir(), '.factorio');
	const scriptOutput = process.env.FACTORIO_SCRIPTOUTPUT ?? path.join(dataDir, 'script-output');
	const verbose = process.env.FACTORIO_VERBOSE === 'true';

	return { binary, dataDir, scriptOutput, verbose };
}
