import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveSettings } from '$lib/server/factorio/settings.js';
import fs from 'node:fs';
import path from 'node:path';

const MIME_TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.json': 'application/json'
};

export const GET: RequestHandler = async ({ params }) => {
	const settings = resolveSettings();
	const tilePath = path.join(settings.scriptOutput, params.path);

	// Path traversal protection
	const resolved = path.resolve(tilePath);
	if (!resolved.startsWith(path.resolve(settings.scriptOutput))) {
		throw error(403, 'Forbidden');
	}

	try {
		const data = fs.readFileSync(resolved);
		const ext = path.extname(resolved).toLowerCase();
		const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

		return new Response(data, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch {
		throw error(404, 'Not found');
	}
};
