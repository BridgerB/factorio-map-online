import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveSettings } from '$lib/server/factorio/settings.js';
import fs from 'node:fs';
import path from 'node:path';

export const GET: RequestHandler = async ({ params }) => {
	const settings = resolveSettings();
	const filePath = path.join(settings.scriptOutput, params.path, 'mapshot.json');

	const resolved = path.resolve(filePath);
	if (!resolved.startsWith(path.resolve(settings.scriptOutput))) {
		throw error(403, 'Forbidden');
	}

	try {
		const data = fs.readFileSync(resolved, 'utf-8');
		return new Response(data, {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		throw error(404, 'Not found');
	}
};
