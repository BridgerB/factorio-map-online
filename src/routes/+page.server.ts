import type { PageServerLoad } from './$types';
import { resolveSettings } from '$lib/server/factorio/settings.js';
import { findShots } from '$lib/server/shots/index.js';

export const load: PageServerLoad = async () => {
	const settings = resolveSettings();
	try {
		const shots = findShots(settings.scriptOutput);
		return { shots };
	} catch {
		return { shots: { all: [] } };
	}
};
