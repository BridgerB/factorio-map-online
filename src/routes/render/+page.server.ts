import fs from 'node:fs';
import path from 'node:path';
import type { PageServerLoad } from './$types';
import { resolveSettings } from '$lib/server/factorio/settings.js';

export const load: PageServerLoad = async () => {
	const settings = resolveSettings();
	const savesDir = path.join(settings.dataDir, 'saves');

	let saves: string[] = [];
	try {
		const entries = fs.readdirSync(savesDir);
		saves = entries
			.filter((e) => e.endsWith('.zip'))
			.map((e) => e.replace(/\.zip$/, ''))
			.sort();
	} catch {
		// saves dir might not exist
	}

	return { saves };
};
