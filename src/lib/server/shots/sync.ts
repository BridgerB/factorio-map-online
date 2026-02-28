import fs from 'node:fs';
import path from 'node:path';
import { db } from '$lib/server/db/index.js';
import { saves, mapshots, surfaces } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { MapshotJSON } from '$lib/types/mapshot.js';

const isMapshotFile = (name: string) => name === 'mapshot.json';

export async function syncMapshotsFromFilesystem(scriptOutput: string): Promise<number> {
	let synced = 0;

	function walk(dir: string) {
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (isMapshotFile(entry.name)) {
				try {
					const raw = fs.readFileSync(fullPath, 'utf-8');
					const json = JSON.parse(raw) as MapshotJSON;
					const shotDir = path.dirname(fullPath);
					const relPath = path.relative(scriptOutput, shotDir);

					syncOne(json, relPath);
					synced++;
				} catch {
					// skip
				}
			}
		}
	}

	walk(scriptOutput);
	return synced;
}

async function syncOne(json: MapshotJSON, dataPrefix: string): Promise<void> {
	// Check if already synced
	const existing = await db.query.mapshots.findFirst({
		where: eq(mapshots.uniqueId, json.unique_id)
	});
	if (existing) return;

	// Upsert save
	const [save] = await db
		.insert(saves)
		.values({
			name: json.savename,
			seed: json.seed,
			mapId: json.map_id,
			mapExchange: json.map_exchange,
			gameVersion: json.game_version
		})
		.onConflictDoUpdate({
			target: saves.name,
			set: {
				seed: json.seed,
				mapId: json.map_id,
				gameVersion: json.game_version,
				updatedAt: new Date()
			}
		})
		.returning();

	// Insert mapshot
	const [mapshot] = await db
		.insert(mapshots)
		.values({
			saveId: save.id,
			uniqueId: json.unique_id,
			tick: json.tick,
			ticksPlayed: json.ticks_played,
			dataPrefix,
			activeMods: json.active_mods
		})
		.returning();

	// Insert surfaces
	for (const s of json.surfaces) {
		await db.insert(surfaces).values({
			mapshotId: mapshot.id,
			surfaceName: s.surface_name,
			surfaceIdx: s.surface_idx,
			surfaceLocalisedName: s.surface_localised_name,
			isPlanet: s.is_planet ?? false,
			isSpacePlatform: s.is_space_platform ?? false,
			filePrefix: s.file_prefix,
			tileSize: s.tile_size,
			renderSize: s.render_size,
			worldMinX: s.world_min.x,
			worldMinY: s.world_min.y,
			worldMaxX: s.world_max.x,
			worldMaxY: s.world_max.y,
			zoomMin: s.zoom_min,
			zoomMax: s.zoom_max,
			stations: s.stations,
			tags: s.tags,
			players: s.players
		});
	}
}
