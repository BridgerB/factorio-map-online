import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveSettings } from '$lib/server/factorio/settings.js';
import { findShots } from '$lib/server/shots/index.js';

export const GET: RequestHandler = async () => {
	const settings = resolveSettings();
	const shots = findShots(settings.scriptOutput);
	return json(shots);
};
