import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getJob } from '$lib/server/render/jobs.js';

export const GET: RequestHandler = async ({ params }) => {
	const job = getJob(params.jobId);
	if (!job) {
		throw error(404, 'Job not found');
	}
	return json(job);
};
