import fs from 'node:fs';
import path from 'node:path';
import type { MapshotJSON, ShotsJSON, ShotsJSONSave, ShotsJSONInfo } from '$lib/types/mapshot.js';

const isMapshotFile = (name: string) => name === 'mapshot.json';

interface ShotInfo {
	name: string;
	encodedPath: string;
	savename: string;
	fsPath: string;
	json: MapshotJSON;
}

function walkForMapshots(dir: string): ShotInfo[] {
	const shots: ShotInfo[] = [];
	const realDir = fs.realpathSync(dir);

	function walk(currentDir: string) {
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(currentDir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);
			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (isMapshotFile(entry.name)) {
				try {
					const raw = fs.readFileSync(fullPath, 'utf-8');
					const json = JSON.parse(raw) as MapshotJSON;
					const shotDir = path.dirname(fullPath);
					const relPath = path.relative(realDir, shotDir);
					const savename = path.dirname(relPath).replaceAll(path.sep, '/');

					// Build encoded path
					const parts = relPath.split(path.sep);
					const encodedPath =
						'/api/tiles/' + parts.map((p) => encodeURIComponent(p)).join('/') + '/';

					shots.push({
						name: relPath.replaceAll(path.sep, '/'),
						encodedPath,
						savename,
						fsPath: shotDir,
						json
					});
				} catch {
					// skip unparseable files
				}
			}
		}
	}

	walk(realDir);
	return shots;
}

export function findShots(scriptOutput: string): ShotsJSON {
	const shots = walkForMapshots(scriptOutput);

	// Sort by ticks_played descending
	shots.sort((a, b) => b.json.ticks_played - a.json.ticks_played);

	// Group by savename
	const bySave = new Map<string, ShotsJSONSave>();
	const saveOrder: string[] = [];

	for (const shot of shots) {
		let save = bySave.get(shot.savename);
		if (!save) {
			save = { savename: shot.savename, versions: [] };
			bySave.set(shot.savename, save);
			saveOrder.push(shot.savename);
		}
		const info: ShotsJSONInfo = {
			name: shot.name,
			encoded_path: shot.encodedPath,
			ticks_played: shot.json.ticks_played
		};
		save.versions.push(info);
	}

	saveOrder.sort();
	return { all: saveOrder.map((s) => bySave.get(s)!) };
}

export function findLatestConfig(
	scriptOutput: string,
	savename: string
): { encoded_path: string } | null {
	const shots = findShots(scriptOutput);
	const save = shots.all.find((s) => s.savename === savename);
	if (!save || save.versions.length === 0) return null;
	return { encoded_path: save.versions[0].encoded_path };
}
