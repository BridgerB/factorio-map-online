import fs from 'node:fs';
import path from 'node:path';

export interface RenderParams {
	area?: 'all' | 'player' | 'entities';
	tilemin?: number;
	tilemax?: number;
	prefix?: string;
	resolution?: number;
	jpgquality?: number;
	minjpgquality?: number;
	surface?: string;
}

export const writeOverrides = (
	params: RenderParams,
	runId: string,
	saveName: string,
	dstPath: string
): void => {
	const data: Record<string, unknown> = {
		onstartup: runId,
		savename: saveName,
		...(params.area && { area: params.area }),
		...(params.tilemin && { tilemin: params.tilemin }),
		...(params.tilemax && { tilemax: params.tilemax }),
		...(params.prefix && { prefix: params.prefix }),
		...(params.resolution && { resolution: params.resolution }),
		...(params.jpgquality && { jpgquality: params.jpgquality }),
		...(params.minjpgquality !== undefined &&
			params.minjpgquality !== -1 && {
				minjpgquality: params.minjpgquality
			}),
		...(params.surface && { surface: params.surface })
	};

	const content = `return [===[${JSON.stringify(data)}]===]\n`;
	fs.writeFileSync(path.join(dstPath, 'overrides.lua'), content, 'utf-8');
};

export const writeMinimalGenerated = (dstPath: string): void => {
	const content = `local data = {}
data.version = "0.0.1"
data.version_hash = "sveltekit-port"
data.files = {}
return data
`;
	fs.writeFileSync(path.join(dstPath, 'generated.lua'), content, 'utf-8');
};
