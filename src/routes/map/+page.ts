import type { PageLoad } from './$types';
import type { MapshotJSON, MapshotConfig } from '$lib/types/mapshot.js';

export const load: PageLoad = async ({ url, fetch }) => {
	const pathParam = url.searchParams.get('path');
	const latestParam = url.searchParams.get('l');

	if (!pathParam && !latestParam) throw new Error('Missing path or l parameter');

	let basePath = pathParam ?? '';
	if (!pathParam && latestParam) {
		const res = await fetch(`/api/latest/${encodeURIComponent(latestParam)}`);
		if (!res.ok) throw new Error(`Save "${latestParam}" not found`);
		const config: MapshotConfig = await res.json();
		basePath = config.encoded_path ?? '';
	}

	// Fetch mapshot.json from the tile path
	const mapshotUrl = `${basePath}mapshot.json`;
	const res = await fetch(mapshotUrl);
	if (!res.ok) throw new Error(`Failed to load mapshot data from ${mapshotUrl}`);
	const mapshot: MapshotJSON = await res.json();

	return { mapshot, basePath };
};
