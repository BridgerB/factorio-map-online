import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveSettings } from '$lib/server/factorio/settings.js';
import { render, type RenderParams } from '$lib/server/render/index.js';
import { createJob, getAllJobs } from '$lib/server/render/jobs.js';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { saveName, ...params } = body as { saveName: string } & RenderParams;

	if (!saveName) {
		throw error(400, 'saveName is required');
	}

	const jobId = crypto.randomUUID();
	const settings = resolveSettings();
	const job = createJob(jobId, saveName);

	const onRenderComplete = (outputPath: string) => {
		job.status = 'completed';
		job.outputPath = outputPath;
		job.completedAt = new Date();
	};

	const onRenderError = (err: unknown) => {
		job.status = 'failed';
		job.error = err instanceof Error ? err.message : String(err);
		job.completedAt = new Date();
	};

	render(settings, saveName, params).then(onRenderComplete).catch(onRenderError);

	return json({ jobId });
};

export const GET: RequestHandler = async () => {
	const allJobs = getAllJobs().map((j) => ({
		id: j.id,
		saveName: j.saveName,
		status: j.status,
		startedAt: j.startedAt,
		completedAt: j.completedAt
	}));
	return json(allJobs);
};
