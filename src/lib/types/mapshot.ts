// Types ported from upstream/mapshot/frontend/common.ts

export interface MapshotConfig {
	encoded_path?: string;
}

export interface FactorioColor {
	a: number;
	r: number;
	g: number;
	b: number;
}

export interface FactorioPosition {
	x: number;
	y: number;
}

export interface FactorioBoundingBox {
	left_top: FactorioPosition;
	right_bottom: FactorioPosition;
}

export interface FactorioIcon {
	name: string;
	type: string;
}

export interface FactorioPlayer {
	name: string;
	position: FactorioPosition;
	color: FactorioColor;
}

export interface FactorioStation {
	backer_name: string;
	bounding_box: FactorioBoundingBox;
}

export interface FactorioTag {
	force_name: string;
	force_index: string;
	icon: FactorioIcon;
	tag_number: number;
	position: FactorioPosition;
	text: string;
}

export interface MapshotJSON {
	unique_id: string;
	savename: string;
	tick: number;
	ticks_played: number;
	seed: number;
	map_exchange?: string;
	map_id: string;
	game_version?: string;
	active_mods?: Record<string, string>;
	surfaces: MapshotSurfaceJSON[];
}

export interface MapshotSurfaceJSON {
	surface_name: string;
	surface_idx: number;
	surface_localised_name?: string;
	is_planet?: boolean;
	is_space_platform?: boolean;
	file_prefix: string;
	tile_size: number;
	render_size: number;
	world_min: FactorioPosition;
	world_max: FactorioPosition;
	zoom_min: number;
	zoom_max: number;
	player?: FactorioPosition;
	players?: FactorioPlayer[] | Record<string, never>;
	stations?: FactorioStation[] | Record<string, never>;
	tags?: FactorioTag[] | Record<string, never>;
}

export interface ShotsJSON {
	all: ShotsJSONSave[];
}

export interface ShotsJSONSave {
	savename: string;
	versions: ShotsJSONInfo[];
}

export interface ShotsJSONInfo {
	name: string;
	encoded_path: string;
	ticks_played: number;
}

export function parseNumber(v: unknown, defvalue: number): number {
	const c = Number(v);
	return isNaN(c) ? defvalue : c;
}

export function isIterable<T>(obj: Iterable<T> | unknown): obj is Iterable<T> {
	if (obj === null || obj === undefined) {
		return false;
	}
	return typeof (obj as Iterable<T>)[Symbol.iterator] === 'function';
}
