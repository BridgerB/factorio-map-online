import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveSettings } from '$lib/server/factorio/settings.js';
import { findLatestConfig } from '$lib/server/shots/index.js';

export const GET: RequestHandler = async ({ params }) => {
	const settings = resolveSettings();
	const config = findLatestConfig(settings.scriptOutput, params.savename);
	if (!config) {
		throw error(404, 'Save not found');
	}
	return json(config);
};
