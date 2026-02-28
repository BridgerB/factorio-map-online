export interface RenderJob {
	id: string;
	saveName: string;
	status: 'running' | 'completed' | 'failed';
	outputPath?: string;
	error?: string;
	startedAt: Date;
	completedAt?: Date;
}

const jobs = new Map<string, RenderJob>();

export function createJob(id: string, saveName: string): RenderJob {
	const job: RenderJob = {
		id,
		saveName,
		status: 'running',
		startedAt: new Date()
	};
	jobs.set(id, job);
	return job;
}

export function getJob(id: string): RenderJob | undefined {
	return jobs.get(id);
}

export function getAllJobs(): RenderJob[] {
	return Array.from(jobs.values());
}
